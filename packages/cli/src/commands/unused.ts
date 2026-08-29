import { context } from '../cli'

export interface UnusedOptions {
  localesDir?: string
  baseLocale?: string
}

export async function unused(options: UnusedOptions = {}) {
  const config = await context.getConfig()

  const localesDir = options.localesDir ?? config.localesDir ?? './src/assets/locales'
  const baseLocale = options.baseLocale ?? config.baseLocale ?? 'en'

  console.log({ localesDir, baseLocale })
}
