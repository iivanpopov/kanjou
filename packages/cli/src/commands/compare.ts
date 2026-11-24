import { compareStrings, getConfig, loadMergedLocale, readAllLocales } from '@kanjou/generator'
import consola from 'consola'

function reportMissingKeys(keysByLocale: Map<string, Set<string>>): void {
  const locales = Array.from(keysByLocale.keys()).sort(compareStrings)

  for (const locale of locales) {
    const ownKeys = keysByLocale.get(locale)
    if (!ownKeys) continue

    const missingKeyOrigins = new Map<string, string[]>()

    for (const other of locales) {
      if (other === locale) continue

      const otherKeys = keysByLocale.get(other)
      if (!otherKeys) continue

      for (const key of otherKeys) {
        if (!ownKeys.has(key)) {
          let origins = missingKeyOrigins.get(key)
          if (!origins) {
            origins = []
            missingKeyOrigins.set(key, origins)
          }
          origins.push(other)
        }
      }
    }

    if (missingKeyOrigins.size > 0) {
      const lines = Array.from(missingKeyOrigins.entries())
        .sort(([a], [b]) => compareStrings(a, b))
        .map(([key, presentIn]) => `  missing "${key}" from ${presentIn.join(', ')}`)
      consola.log(`${locale}\n${lines.join('\n')}`)
    }
  }
}

export async function compare(): Promise<void> {
  const config = getConfig()
  const { locales, localeFiles, localeNamespaces } = await readAllLocales(config.localesDir)
  if (locales.length === 0) return

  const fileByLocale = new Map(localeFiles.map((file) => [file.name, file]))
  const keysByLocale = new Map<string, Set<string>>()

  await Promise.all(
    locales.map(async (locale) => {
      const messages = await loadMergedLocale(
        fileByLocale.get(locale),
        localeNamespaces[locale] ?? [],
      )
      keysByLocale.set(locale, new Set(Object.keys(messages)))
    }),
  )

  reportMissingKeys(keysByLocale)
}
