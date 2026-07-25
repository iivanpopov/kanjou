import consola from 'consola'

import type { KanjouPluginContext } from '#/shared/context'

import { writeLocalesDts, writeVirtualDts } from '#/shared/codegen'

export function generate(ctx: KanjouPluginContext) {
  return async () => {
    const config = await ctx.getConfig()

    if (!config.dts) {
      consola.warn('dts not configured - nothing to generate')
      return
    }

    await Promise.all([writeLocalesDts(config), writeVirtualDts(config)])

    consola.success('generated .d.ts files')
  }
}
