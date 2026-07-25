import consola from 'consola'

import { createContext } from '#/shared/context'
import { filterLocaleFiles, readLocaleFile, readdir } from '#/shared/io'

export interface CompareCommandOptions {
  localesDir?: string
  baseLocale?: string
}

export async function compare(options: CompareCommandOptions = {}) {
  const ctx = createContext(options)
  const config = await ctx.getConfig()

  const files = await readdir(config.localesDir)
  const localeFiles = filterLocaleFiles(files)
  const locales = localeFiles.map((file) => file.name)

  const keysByLocale = new Map(
    await Promise.all(
      localeFiles.map(async (file) => {
        const messages = await readLocaleFile(file)
        return [file.name, new Set(Object.keys(messages!))] as const
      }),
    ),
  )

  for (const locale of locales) {
    const ownKeys = keysByLocale.get(locale)!

    const missingKeyOrigins = new Map<string, Set<string>>()

    for (const other of locales) {
      if (other === locale) continue

      const missingKeys = keysByLocale.get(other)!.difference(ownKeys)

      for (const key of missingKeys) missingKeyOrigins.getOrInsert(key, new Set()).add(other)
    }

    if (!missingKeyOrigins.size) continue

    const lines = missingKeyOrigins
      .entries()
      .map(([key, origins]) => `  missing "${key}" from ${[...origins].join(', ')}`)
      .toArray()

    consola.log(`${locale}\n${lines.join('\n')}`)
  }
}
