import path from 'node:path'

import type { ParsedPath } from './path'

const LOCALE_FILE_EXT_NAME = new Set(['.ts', '.js', '.mts', '.mjs', '.json'])

export function filterLocaleFiles<File extends string | ParsedPath>(files: File[]): File[] {
  return files.filter((file) =>
    typeof file === 'string'
      ? LOCALE_FILE_EXT_NAME.has(path.extname(file))
      : LOCALE_FILE_EXT_NAME.has(file.ext),
  )
}
