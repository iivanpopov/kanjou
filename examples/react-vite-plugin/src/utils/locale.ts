import type { Locale, Message } from '@kanjou/react'

import locales from 'virtual:kanjou/locales'

const cache = new Map<Locale, Record<string, Message>>()

export async function loader(locale: Locale) {
  if (cache.has(locale)) return cache.get(locale)!

  await new Promise((resolve) => setTimeout(resolve, 1000))
  const messages = await locales[locale]()
  cache.set(locale, messages)

  return messages
}
