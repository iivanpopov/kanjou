import { createJiti } from 'jiti'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { ParsedFile } from '#/shared/path'

import { parse } from '#/shared/path'

export async function readLocaleFile(localeFile: string | ParsedFile) {
  const file = typeof localeFile === 'string' ? parse(localeFile) : localeFile

  let messages: Record<string, string> | undefined = undefined

  if (['.ts', '.js'].includes(file.ext)) {
    const jiti = createJiti(import.meta.url)
    messages = await jiti.import(file.absolute, { default: true })
  } else if (file.ext === '.json') {
    const messagesRaw = await fs.readFile(file.absolute, 'utf-8')
    messages = JSON.parse(messagesRaw)
  }

  return messages
}

const LOCALE_FILE_EXT_NAME = new Set(['.ts', '.js', '.json'])

export function filterLocaleFiles<File extends string | ParsedFile>(files: File[]): File[] {
  return files.filter((file) =>
    typeof file === 'string'
      ? LOCALE_FILE_EXT_NAME.has(path.extname(file))
      : LOCALE_FILE_EXT_NAME.has(file.ext),
  )
}
