import type { PrettierOptions } from '../format'

import { format } from '../format'
import { filterLocaleFiles, loadFile, readdir, writeFile } from '../io'
import { compileLocalesDts, compileVirtualDts } from './compile'

export interface WriteLocalesDtsOptions {
  baseLocale: string
  localesDir: string
  prettier?: PrettierOptions
}

export async function writeLocalesDts(localesPath: string, options: WriteLocalesDtsOptions) {
  const localeFiles = filterLocaleFiles(await readdir(options.localesDir))
  const locales = localeFiles.map((file) => file.name)

  const baseLocale = localeFiles.find((file) => file.name === options.baseLocale)
  if (!baseLocale) {
    throw new Error(`"${options.baseLocale}" file not found in "${options.localesDir}"`)
  }

  const messages = await loadFile<Record<string, string>>(baseLocale)
  const localesDts = compileLocalesDts(messages!, locales)
  const formattedDts = await format(localesDts, options.prettier)
  await writeFile(localesPath, formattedDts, { mkdir: { recursive: true } })
}

export interface WriteVirtualDtsOptions {
  prettier?: PrettierOptions
}

export async function writeVirtualDts(virtualPath: string, options: WriteVirtualDtsOptions) {
  const formattedDts = await format(compileVirtualDts(), options.prettier)
  await writeFile(virtualPath, formattedDts, { mkdir: { recursive: true } })
}
