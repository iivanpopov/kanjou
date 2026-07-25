import { createContext } from '#/shared/context'

export interface UnusedCommandOptions {
  localesDir?: string
  baseLocale?: string
}

export async function unused(options: UnusedCommandOptions = {}) {
  const ctx = createContext(options)
  console.log(await ctx.getConfig())
}
