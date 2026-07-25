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

  const localesDir = path.dirname(config.sourceLocale)
  const localeFiles = filterLocaleFiles(await readdir(localesDir))
  const locales = localeFiles.map((file) => file.name)

  const messages = (await readLocaleFile(config.sourceLocale)) ?? {}
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
