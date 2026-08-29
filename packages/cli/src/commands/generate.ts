import consola from 'consola'
import path from 'node:path'

import { writeLocalesDts, writeVirtualDts } from '#/shared/codegen'

import { context } from '../cli'

export interface GenerateOptions {
  localesDir?: string
  baseLocale?: string
  outDir?: string
  locales?: boolean
  virtual?: boolean
}

export async function generate(options: GenerateOptions = {}) {
  const config = await context.getConfig()

  const localesDir = options.localesDir ?? config.localesDir ?? './src/assets/locales'
  const baseLocale = options.baseLocale ?? config.baseLocale ?? 'en'

  if (config.dts === false) return

  const configOutDir = typeof config.dts === 'object' ? config.dts.outDir : undefined
  const outDir = options.outDir ?? configOutDir ?? './generated'

  if (options.locales !== false) {
    const localesPath = path.join(outDir, 'locales.kanjou.d.ts')
    await writeLocalesDts(localesPath, { localesDir, baseLocale, prettier: config.prettier })
    consola.success(`generated ${localesPath}`)
  }

  if (options.virtual !== false) {
    const virtualPath = path.join(outDir, 'virtual.kanjou.d.ts')
    await writeVirtualDts(virtualPath, { prettier: config.prettier })
    consola.success(`generated ${virtualPath}`)
  }
}
