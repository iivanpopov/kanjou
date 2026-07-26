import type { UserConfig } from '@kanjou/config'

import { createContext } from '#/shared/context'

export interface UnusedOptions {
  localesDir?: string
  baseLocale?: string
}

export interface ResolvedUnusedOptions {
  localesDir: string
  baseLocale: string
}

function resolveOptions(options: UnusedOptions, config: UserConfig): ResolvedUnusedOptions {
  return {
    localesDir: options.localesDir ?? config.localesDir,
    baseLocale: options.baseLocale ?? config.baseLocale,
  }
}

export async function unused(_options: UnusedOptions = {}) {
  const ctx = createContext()
  const config = await ctx.getConfig()
  const options = resolveOptions(_options, config)

  console.log(options)
}
