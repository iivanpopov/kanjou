import consola from 'consola'

import { writeLocalesDts, writeVirtualDts } from '#/shared/codegen'
import { createContext } from '#/shared/context'

export interface GenerateCommandOptions {
  localesDir?: string
  baseLocale?: string
}

export async function generate(options: GenerateCommandOptions = {}) {
  const ctx = createContext(options)
  const config = await ctx.getConfig()

  if (!config.dts) {
    consola.warn('dts not configured - nothing to generate')
    return
  }

  await Promise.all([writeLocalesDts(config), writeVirtualDts(config)])

  consola.success('Generated .d.ts files')
}
