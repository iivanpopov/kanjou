import { Locale, Message } from '@kanjou/react'

export async function loadLocale(locale: Locale): Promise<Record<string, Message>> {
  const messages = await import(`../assets/locales/${locale}.ts`)
  return messages.default
}
