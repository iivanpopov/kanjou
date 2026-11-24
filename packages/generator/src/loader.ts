import { createJiti } from 'jiti'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { Config } from './config'

export interface ParsedFile extends path.ParsedPath {
  absolute: string
  relative: string
}

export function parse(file: string): ParsedFile {
  const parsed = path.parse(file)
  return {
    ...parsed,
    absolute: path.resolve(parsed.dir, parsed.base),
    relative: path.join(parsed.dir, parsed.base),
  }
}

const jiti = createJiti(import.meta.url, { moduleCache: false, tryNative: false })

export const LOCALE_EXTENSIONS: ReadonlySet<string> = new Set(['.ts', '.js', '.mts', '.mjs'])

function compareStrings(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export async function load<File = any>(file: ParsedFile | string): Promise<File> {
  const filePath = typeof file === 'string' ? path.resolve(file) : file.absolute
  const result = await jiti.import<Record<string, string>>(filePath, { default: true })
  if (result === null || result === undefined) return {} as File
  if (typeof result !== 'object' || Array.isArray(result)) {
    throw new Error(
      `Invalid locale file "${filePath}": default export must be a plain object mapping message keys to strings`,
    )
  }

  for (const [key, value] of Object.entries(result)) {
    if (typeof value !== 'string') {
      throw new Error(
        `Invalid locale file "${filePath}": message "${key}" must be a string, received ${typeof value}`,
      )
    }
  }

  return result as File
}

export async function readLocaleFiles(localesDir: string): Promise<ParsedFile[]> {
  try {
    const entries = await fs.readdir(localesDir, { withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => parse(path.join(localesDir, entry.name)))
      .filter((file) => LOCALE_EXTENSIONS.has(file.ext))
      .sort((a, b) => compareStrings(a.base, b.base))

    const seen = new Map<string, ParsedFile>()
    for (const file of files) {
      const existing = seen.get(file.name)
      if (existing) {
        throw new Error(
          `Duplicate locale/namespace name "${file.name}": conflicting files "${existing.relative}" and "${file.relative}"`,
        )
      }
      seen.set(file.name, file)
    }

    return files
  } catch (err: any) {
    if (err.code === 'ENOENT') return []
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
  const localeDir = path.resolve(localesDir, locale)
  try {
    const entries = await fs.readdir(localeDir, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name)

      if (LOCALE_EXTENSIONS.has(ext)) files.push(path.join(localeDir, entry.name))
    }
    return files.sort(compareStrings)
  } catch (err: any) {
    if (err.code === 'ENOENT') return []
    throw err
  }
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
  } catch (err: any) {
    if (err.code === 'ENOENT') return {}
    throw err
  }
}

export async function loadMessages(
  config: Config,
): Promise<Record<string, Record<string, string>>> {
  const localeFiles = await readLocaleFiles(config.localesDir)
  const messagesByLocale: Record<string, Record<string, string>> = Object.create(null)

  const loaded = await Promise.all(
    localeFiles.map(async (file) => [file.name, await load<Record<string, string>>(file)] as const),
  )

  for (const [locale, messages] of loaded) {
    messagesByLocale[locale] = messages
  }

  return messagesByLocale
}
