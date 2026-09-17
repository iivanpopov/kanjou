import { getConfig, loadMessages } from '@kanjou/generator'
import consola from 'consola'

export async function compare() {
  const config = getConfig()
  const messagesByLocale = await loadMessages(config)

  const locales = Object.keys(messagesByLocale)
  const keysByLocale = new Map<string, Set<string>>()

  for (const locale of locales) {
    keysByLocale.set(locale, new Set(Object.keys(messagesByLocale[locale] ?? {})))
  }

  for (const locale of locales) {
    const ownKeys = keysByLocale.get(locale)!
    const missingKeyOrigins = new Map<string, string[]>()

    for (const other of locales) {
      if (other === locale) continue

      const otherKeys = keysByLocale.get(other)!
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
      const lines = Array.from(missingKeyOrigins.entries()).map(
        ([key, presentIn]) => `  missing "${key}" from ${presentIn.join(', ')}`,
      )
      consola.log(`${locale}\n${lines.join('\n')}`)
    }
  }
}
