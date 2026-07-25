import type { UserConfig } from '@kanjou/config'

import path from 'node:path'

import { filterLocaleFiles, readLocaleFile, readdir, writeFile } from '../io'
import { compileLocalesDts, compileVirtualDts } from './compile'
import { format } from './format'

export function resolveLocalesDtsPath(config: UserConfig): string | undefined {
  return (
    config.dts?.localesPath ??
    (config.dts?.outDir ? path.join(config.dts.outDir, 'locales.kanjou.d.ts') : undefined)
  )
}

export function resolveVirtualDtsPath(config: UserConfig): string | undefined {
  return (
    config.dts?.virtualPath ??
    (config.dts?.outDir ? path.join(config.dts.outDir, 'virtual.kanjou.d.ts') : undefined)
  )
}

export async function writeLocalesDts(config: UserConfig) {
  const localesPath = resolveLocalesDtsPath(config)
  if (!localesPath) return

  const files = await readdir(config.localesDir)
  const localeFiles = filterLocaleFiles(files)
  const locales = localeFiles.map((file) => file.name)

  const sourceFile = localeFiles.find((file) => file.name === config.baseLocale)
  if (!sourceFile) {
    throw new Error(
      `[@kanjou/codegen] Base locale "${config.baseLocale}" file not found in "${config.localesDir}"`,
    )
  }

  const messages = (await readLocaleFile(sourceFile)) ?? {}
  const localesDts = compileLocalesDts(messages, locales)
  const formattedDts = await format(localesDts, config.format)
  await writeFile(localesPath, formattedDts, { mkdir: { recursive: true } })
}

export async function writeVirtualDts(config: UserConfig) {
  const virtualPath = resolveVirtualDtsPath(config)
  if (!virtualPath) return

  const formattedDts = await format(compileVirtualDts(), config.format)
  await writeFile(virtualPath, formattedDts, { mkdir: { recursive: true } })
}
