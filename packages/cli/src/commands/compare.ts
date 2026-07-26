import type { UserConfig } from '@kanjou/config'

import consola from 'consola'

import { filterLocaleFiles, readLocaleFile, readdir } from '#/shared/io'

import { context } from '../cli'

export interface CompareOptions {
  localesDir?: string
  baseLocale?: string
}

export interface ResolvedCompareOptions {
  localesDir: string
  baseLocale: string
}

function resolveOptions(options: CompareOptions, config: UserConfig): ResolvedCompareOptions {
  return {
    localesDir: options.localesDir ?? config.localesDir,
    baseLocale: options.baseLocale ?? config.baseLocale,
  }
}

export async function compare(_options: CompareOptions = {}) {
  const config = await context.getConfig()
  const options = resolveOptions(_options, config)

  const localeFiles = filterLocaleFiles(await readdir(options.localesDir))
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
