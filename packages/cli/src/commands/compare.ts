import { getConfig, readLocaleFiles } from '@kanjou/generator'
import consola from 'consola'

import { load } from '#/shared/load'

export async function compare() {
  const config = getConfig()

  const localeFiles = await readLocaleFiles(config.localesDir)

  const keysByLocale = new Map(
    await Promise.all(
      localeFiles.map(async (file) => {
        const messages = await load(file)
        return [file.name, new Set(Object.keys(messages))] as const
      }),
    ),
  )

  const locales = localeFiles.map((file) => file.name)

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
