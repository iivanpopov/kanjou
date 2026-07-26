import type { UserConfig } from '@kanjou/config'
import type { Options as PrettierOptions } from 'prettier'

import consola from 'consola'
import path from 'node:path'

import { writeLocalesDts, writeVirtualDts } from '#/shared/codegen'
import { createContext } from '#/shared/context'

export interface GenerateOptions {
  localesDir?: string
  baseLocale?: string
  locales?: boolean
  virtual?: boolean
}

export interface ResolvedGenerateOptions {
  localesDir: string
  baseLocale: string
  localesPath: string | false
  virtualPath: string | false
  prettier: Omit<PrettierOptions, 'parser'> | undefined
}

function resolveOptions(options: GenerateOptions, config: UserConfig): ResolvedGenerateOptions {
  const locales = options.locales ?? config.dts?.locales ?? true
  const virtual = options.virtual ?? config.dts?.virtual ?? true

  return {
    localesDir: options.localesDir ?? config.localesDir,
    baseLocale: options.baseLocale ?? config.baseLocale,
    localesPath:
      locales && (config.dts?.localesPath ?? path.join(config.dts!.outDir!, 'locales.kanjou.d.ts')),
    virtualPath:
      virtual && (config.dts?.virtualPath ?? path.join(config.dts!.outDir!, 'virtual.kanjou.d.ts')),
    prettier: config.prettier,
  }
}

export async function generate(_options: GenerateOptions = {}) {
  const ctx = createContext()
  const config = await ctx.getConfig()
  const options = resolveOptions(_options, config)

  if (options.localesPath) {
    await writeLocalesDts(options.localesPath, options)
    consola.success(`generated ${options.localesPath}`)
  }

  if (options.virtualPath) {
    await writeVirtualDts(options.virtualPath, options)
    consola.success(`generated ${options.virtualPath}`)
  }
}
