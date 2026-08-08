import type { JitiResolveOptions } from 'jiti'

import { createJiti } from 'jiti'
import fs from 'node:fs/promises'
import path from 'node:path'

import type { ParsedPath } from './path'

import { parse } from './path'

export type WriteFileData = Parameters<typeof fs.writeFile>[1]
export type WriteFileOptions = Parameters<typeof fs.writeFile>[2] & {
  mkdir?: boolean | { recursive: boolean }
}

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

    return Object.assign(parsed, { absolute, relative })
  })
}

const jiti = createJiti(import.meta.url)

export async function loadFile<Value = unknown>(
  localeFile: string | ParsedPath,
  options?: JitiResolveOptions,
): Promise<Value | undefined> {
  const file = typeof localeFile === 'string' ? parse(localeFile) : localeFile
  return jiti.import<Value>(file.absolute, { default: true, ...options })
}
