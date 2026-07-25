import { createContext } from '#/shared/context'

export interface MissingCommandOptions {
  localesDir?: string
  baseLocale?: string
}

export async function missing(options: MissingCommandOptions = {}) {
  const ctx = createContext(options)
  console.log(await ctx.getConfig())
}
