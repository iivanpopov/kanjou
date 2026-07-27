import type { UserConfig } from '@kanjou/config'

import { createContext } from '#/shared/context'

export interface MissingOptions {
  localesDir?: string
  baseLocale?: string
}

export interface ResolvedMissingOptions {
  localesDir: string
  baseLocale: string
}

function resolveOptions(options: MissingOptions, config: UserConfig): ResolvedMissingOptions {
  return {
    localesDir: options.localesDir ?? config.localesDir,
    baseLocale: options.baseLocale ?? config.baseLocale,
  }
}

export async function missing(options: MissingOptions) {
  const ctx = createContext()
  const config = await ctx.getConfig()
  const _options = resolveOptions(options, config)

  console.log(_options)
}
