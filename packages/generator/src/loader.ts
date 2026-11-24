import { createJiti } from 'jiti'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { Config } from './config'

import { KanjouLoadError } from './errors'

export interface ParsedFile {
  root: string
  dir: string
  base: string
  ext: string
  name: string
  absolute: string
  relative: string
}

export interface LocaleEntries {
  locales: string[]
  localeFiles: ParsedFile[]
  localeNamespaces: Record<string, ParsedFile[]>
}

export function parse(file: string): ParsedFile {
  const parsed = path.parse(file)
  return {
    root: parsed.root,
    dir: parsed.dir,
    base: parsed.base,
    ext: parsed.ext,
    name: parsed.name,
    absolute: path.resolve(parsed.dir, parsed.base),
    relative: path.join(parsed.dir, parsed.base),
  }
}

const jiti = createJiti(import.meta.url, { moduleCache: false, tryNative: false })

export const LOCALE_EXTENSIONS: ReadonlySet<string> = new Set(['.ts', '.js', '.mts', '.mjs'])
export const RESERVED_LOCALE_NAMES: ReadonlySet<string> = new Set(['locales', 'namespaces'])

export function compareStrings(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function isEnoentError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 'ENOENT'
}

export function validateReservedLocaleName(locale: string, location?: string): void {
  if (RESERVED_LOCALE_NAMES.has(locale)) {
    const suffix = location ? ` (${location})` : ''
    throw new KanjouLoadError(
      `Reserved locale name "${locale}"${suffix} conflicts with virtual module "virtual:kanjou/${locale}"`,
      location ?? locale,
    )
  }
}

export function validateReservedLocaleNames(
  localeFiles: readonly ParsedFile[],
  namespaceLocales: Iterable<string> = [],
  localesDir?: string,
): void {
  for (const file of localeFiles) {
    validateReservedLocaleName(file.name, file.relative)
  }
  for (const locale of namespaceLocales) {
    const dirPath = localesDir ? path.join(localesDir, locale) : locale
    validateReservedLocaleName(locale, dirPath)
  }
}

export async function load(file: ParsedFile | string): Promise<Record<string, string>> {
  const filePath = typeof file === 'string' ? path.resolve(file) : file.absolute
  let result: unknown
  try {
    result = await jiti.import(filePath, { default: true })
  } catch (err) {
    throw new KanjouLoadError(
      `Failed to load locale file "${filePath}": ${err instanceof Error ? err.message : String(err)}`,
      filePath,
      { cause: err },
    )
  }

  if (result === null || result === undefined) return {}
  if (typeof result !== 'object') {
    throw new KanjouLoadError(
      `Invalid locale file "${filePath}": default export must be a plain object mapping message keys to strings`,
      filePath,
    )
  }

  const proto: unknown = Object.getPrototypeOf(result)
  if (proto !== Object.prototype && proto !== null) {
    throw new KanjouLoadError(
      `Invalid locale file "${filePath}": default export must be a plain object mapping message keys to strings`,
      filePath,
    )
  }

  for (const [key, value] of Object.entries(result)) {
    if (typeof value !== 'string') {
      throw new KanjouLoadError(
        `Invalid locale file "${filePath}": message "${key}" must be a string, received ${typeof value}`,
        filePath,
      )
    }
  }

  return result as Record<string, string>
}

function isDeclarationFile(fileName: string): boolean {
  return fileName.endsWith('.d.ts') || fileName.endsWith('.d.mts') || fileName.endsWith('.d.cts')
}

export async function readLocaleFiles(localesDir: string): Promise<ParsedFile[]> {
  try {
    const entries = await fs.readdir(localesDir, { withFileTypes: true })
    const files: ParsedFile[] = []
    for (const entry of entries) {
      if (!entry.isFile() || isDeclarationFile(entry.name)) continue
      const file = parse(path.join(localesDir, entry.name))
      if (LOCALE_EXTENSIONS.has(file.ext)) {
        files.push(file)
      }
    }
    files.sort((a, b) => compareStrings(a.name, b.name))

    const seen = new Map<string, ParsedFile>()
    for (const file of files) {
      const existing = seen.get(file.name)
      if (existing) {
        throw new KanjouLoadError(
          `Duplicate locale/namespace name "${file.name}": conflicting files "${existing.relative}" and "${file.relative}"`,
          file.relative,
        )
      }
      seen.set(file.name, file)
    }

    return files
  } catch (err: unknown) {
    if (isEnoentError(err)) return []
    throw err
  }
}

export async function readNamespaceFiles(
  localesDir: string,
  locale: string,
): Promise<ParsedFile[]> {
  return await readLocaleFiles(path.join(localesDir, locale))
}

export async function readLocaleWatchFiles(localesDir: string, locale: string): Promise<string[]> {
  const files = await readNamespaceFiles(localesDir, locale)
  return files.map((file) => file.absolute)
}

export async function readLocaleNamespaces(
  localesDir: string,
): Promise<Record<string, ParsedFile[]>> {
  try {
    const entries = await fs.readdir(localesDir, { withFileTypes: true })
    const dirs = entries
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => compareStrings(a.name, b.name))
    const result: Record<string, ParsedFile[]> = Object.create(null)

    const resolved = await Promise.all(
      dirs.map(async (dir) => [dir.name, await readNamespaceFiles(localesDir, dir.name)] as const),
    )

    for (const [locale, files] of resolved) {
      if (files.length > 0) {
        result[locale] = files
      }
    }

    return result
  } catch (err: unknown) {
    if (isEnoentError(err)) return {}
    throw err
  }
}

export async function readAllLocales(localesDir: string): Promise<LocaleEntries> {
  const [localeFiles, localeNamespaces] = await Promise.all([
    readLocaleFiles(localesDir),
    readLocaleNamespaces(localesDir),
  ])

  validateReservedLocaleNames(localeFiles, Object.keys(localeNamespaces), localesDir)

  const locales = Array.from(
    new Set([...localeFiles.map((file) => file.name), ...Object.keys(localeNamespaces)]),
  ).sort(compareStrings)

  return { locales, localeFiles, localeNamespaces }
}

export async function loadMergedLocale(
  localeFile: ParsedFile | undefined,
  namespaceFiles: readonly ParsedFile[],
): Promise<Record<string, string>> {
  const filesToLoad = localeFile ? [localeFile, ...namespaceFiles] : [...namespaceFiles]
  if (filesToLoad.length === 0) return Object.create(null)

  const loaded = await Promise.all(filesToLoad.map((file) => load(file)))
  return Object.assign(Object.create(null), ...loaded)
}

export async function loadMessages(
  config: Config,
): Promise<Record<string, Record<string, string>>> {
  const { locales, localeFiles, localeNamespaces } = await readAllLocales(config.localesDir)
  const fileByLocale = new Map(localeFiles.map((file) => [file.name, file]))
  const messagesByLocale: Record<string, Record<string, string>> = Object.create(null)

  const loaded = await Promise.all(
    locales.map(async (locale) => {
      const messages = await loadMergedLocale(
        fileByLocale.get(locale),
        localeNamespaces[locale] ?? [],
      )
      return [locale, messages] as const
    }),
  )

  for (const [locale, messages] of loaded) {
    messagesByLocale[locale] = messages
  }

  return messagesByLocale
}
