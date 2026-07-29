import { createJiti } from 'jiti'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { ParsedPath } from './path'

import { parse } from './path'

export type FsWriteFileParams = Parameters<typeof fs.writeFile>
export type WriteFileData = FsWriteFileParams[1]
export type WriteFileOptions = FsWriteFileParams[2] & { mkdir?: boolean | { recursive: boolean } }

export async function writeFile(file: string, data: WriteFileData, options?: WriteFileOptions) {
  if (typeof options?.mkdir === 'boolean' && options?.mkdir) {
    await fs.mkdir(path.dirname(file))
  } else if (typeof options?.mkdir === 'object' && options?.mkdir) {
    await fs.mkdir(path.dirname(file), { recursive: options?.mkdir.recursive })
  }
  await fs.writeFile(file, data, options)
}

export async function readdir(dir: string) {
  const files = await fs.readdir(dir)
  return files.map((file) => {
    const absolute = path.resolve(dir, file)
    const relative = path.join(dir, file)

    const parsed = path.parse(absolute)

    Object.assign(parsed, { absolute, relative })
    return parsed as ParsedPath
  })
}

const jiti = createJiti(import.meta.url)

export async function loadFile<T = unknown>(
  localeFile: string | ParsedPath,
): Promise<T | undefined> {
  const file = typeof localeFile === 'string' ? parse(localeFile) : localeFile
  return jiti.import<T>(file.absolute, { default: true })
}
