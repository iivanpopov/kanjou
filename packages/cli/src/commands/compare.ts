import type { ParsedFile } from '@kanjou/generator'

import { getConfig, load, readLocaleFiles, readLocaleNamespaces } from '@kanjou/generator'
import consola from 'consola'

function reportMissingKeys(
  keysByLocale: Map<string, Set<string>>,
  formatHeader: (locale: string) => string = (locale) => locale,
) {
  const locales = Array.from(keysByLocale.keys()).sort()

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
      consola.log(`${formatHeader(locale)}\n${lines.join('\n')}`)
    }
  }
}

export async function compare(): Promise<void> {
  const config = getConfig()
  const [localeFiles, localeNamespaces] = await Promise.all([
    readLocaleFiles(config.localesDir),
    readLocaleNamespaces(config.localesDir),
  ])

  if (localeFiles.length > 0) {
    const topLevelKeys = new Map<string, Set<string>>()
    await Promise.all(
      localeFiles.map(async (file) => {
        const messages = await load<Record<string, string>>(file)
        topLevelKeys.set(file.name, new Set(Object.keys(messages)))
      }),
    )
    reportMissingKeys(topLevelKeys)
  }

  const namespaceLocales = Object.keys(localeNamespaces).sort()
  if (namespaceLocales.length > 0) {
    const allNamespaces = new Set<string>()
    const filesByLocale = new Map<string, Map<string, ParsedFile>>()

    for (const locale of namespaceLocales) {
      const nsMap = new Map<string, ParsedFile>()
      for (const file of localeNamespaces[locale] ?? []) {
        allNamespaces.add(file.name)
        nsMap.set(file.name, file)
      }
      filesByLocale.set(locale, nsMap)
    }

    const loadedKeysByLocaleNs = new Map<string, Map<string, Set<string>>>()
    await Promise.all(
      namespaceLocales.map(async (locale) => {
        const nsKeys = new Map<string, Set<string>>()
        loadedKeysByLocaleNs.set(locale, nsKeys)
        const nsMap = filesByLocale.get(locale)!
        await Promise.all(
          Array.from(nsMap.entries()).map(async ([namespace, file]) => {
            const messages = await load<Record<string, string>>(file)
            nsKeys.set(namespace, new Set(Object.keys(messages)))
          }),
        )
      }),
    )

    for (const namespace of Array.from(allNamespaces).sort()) {
      const keysByLocale = new Map<string, Set<string>>()
      for (const locale of namespaceLocales) {
        keysByLocale.set(locale, loadedKeysByLocaleNs.get(locale)?.get(namespace) ?? new Set())
      }
      reportMissingKeys(keysByLocale, (locale) => `${locale}/${namespace}`)
    }
  }
}
