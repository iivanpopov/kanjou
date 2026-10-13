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

const jiti = createJiti(import.meta.url, { moduleCache: false })

export const LOCALE_EXTENSIONS: ReadonlySet<string> = new Set(['.ts', '.js', '.mts', '.mjs'])

export async function load<File = any>(file: ParsedFile | string): Promise<File> {
  const filePath = typeof file === 'string' ? path.resolve(file) : file.absolute
  const result = await jiti.import<Record<string, string>>(filePath, { default: true })
  return (result ?? {}) as File
}

export async function readLocaleFiles(localesDir: string): Promise<ParsedFile[]> {
  try {
    const entries = await fs.readdir(localesDir)

    return entries
      .map((file) => parse(path.join(localesDir, file)))
      .filter((file) => LOCALE_EXTENSIONS.has(file.ext))
  } catch (err: any) {
    if (err.code === 'ENOENT') return []
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
