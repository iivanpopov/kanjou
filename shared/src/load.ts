import { createJiti } from 'jiti'
import path from 'node:path'

import type { ParsedFile } from './path'

const jiti = createJiti(import.meta.url)

export async function load<File = any>(file: ParsedFile | string): Promise<File> {
  const filePath = typeof file === 'string' ? path.resolve(file) : file.absolute
  const result = await jiti.import<Record<string, string>>(filePath, { default: true })
  return (result ?? {}) as File
}
