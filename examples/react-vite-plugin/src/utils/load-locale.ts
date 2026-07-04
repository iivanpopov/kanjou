import type { Locale } from '@kanjou/react'

import localeModules from 'virtual:kanjou/modules'

export async function loadLocale(locale: Locale): Promise<Record<string, any>> {
  const messages = await localeModules[locale]()
  return messages.default
}
