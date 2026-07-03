import type { ReactNode } from 'react'

import { I18nProvider } from '@kanjou/react'
import { useState } from 'react'

import { loadLocale } from '#/utils'

import type { Locale } from './locale-provider'

import { LocaleContext } from './locale-provider'

export function IntlProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode
  initialLocale: Locale
  initialMessages: Record<string, string>
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Record<string, string>>(initialMessages)

  const setLocale = async (newLocale: Locale) => {
    const newMessages = await loadLocale(newLocale)
    setMessages(newMessages)
    setLocaleState(newLocale)
  }

  return (
    <LocaleContext value={{ locale, setLocale }}>
      {/* kanjou provider only needs the current locale and raw messages object */}
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
    </LocaleContext>
  )
}
