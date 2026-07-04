import type { Locale } from '#/providers/intl-provider'

// https://vite.dev/guide/features#dynamic-import
const localeModules: Record<Locale, () => Promise<{ default: Record<string, any> }>> = {
  // these virtual modules are injected by kanjou vite plugin
  en: () => import('virtual:kanjou/en'),
  es: () => import('virtual:kanjou/es'),
  fr: () => import('virtual:kanjou/fr'),
}

export async function loadLocale(locale: Locale): Promise<Record<string, any>> {
  const messages = await localeModules[locale]()
  return messages.default
}
