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

export async function load<File = any>(file: ParsedFile | string): Promise<File> {
  const filePath = typeof file === 'string' ? path.resolve(file) : file.absolute
  const result = await jiti.import<Record<string, string>>(filePath, { default: true })
  return (result ?? {}) as File
}

export async function readLocaleFiles(localesDir: string): Promise<ParsedFile[]> {
  try {
    const entries = await fs.readdir(localesDir, { withFileTypes: true })

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => parse(path.join(localesDir, entry.name)))
      .filter((file) => LOCALE_EXTENSIONS.has(file.ext))
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
    const entries = await fs.readdir(localeDir, { recursive: true, withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
      if (!entry.isFile()) continue
      const ext = path.extname(entry.name)

      if (LOCALE_EXTENSIONS.has(ext)) files.push(path.join(entry.parentPath, entry.name))
    }
    return files
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
    const dirs = entries.filter((entry) => entry.isDirectory())
    const result: Record<string, ParsedFile[]> = {}

    await Promise.all(
      dirs.map(async (dir) => {
        const files = await readNamespaceFiles(localesDir, dir.name)
        if (files.length > 0) {
          result[dir.name] = files
        }
      }),
    )

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
  const messagesByLocale: Record<string, Record<string, string>> = {}

  await Promise.all(
    localeFiles.map(async (file) => {
      const messages = await load<Record<string, string>>(file)
      messagesByLocale[file.name] = messages
    }),
  )

  return messagesByLocale
}
