import type { Locale } from '@kanjou/react'

import locales from 'virtual:kanjou/locales'

export async function loadLocale(locale: Locale): Promise<Record<string, any>> {
  const messages = await locales[locale]()
  return messages.default
}
