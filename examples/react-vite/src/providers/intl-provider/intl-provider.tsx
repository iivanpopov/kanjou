import type { Locale, Messages } from '@kanjou/react'
import type { ReactNode } from 'react'

import { KanjouProvider } from '@kanjou/react'
import { useState } from 'react'

import { IntlContext } from './intl-context'

export function IntlProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode
  initialLocale: Locale
  initialMessages: Messages
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Messages>(initialMessages)

  return (
    <IntlContext value={{ locale, setLocale, messages, setMessages }}>
      {/* kanjou provider only needs the current locale and raw messages object */}
      <KanjouProvider locale={locale} messages={messages}>
        {children}
      </KanjouProvider>
    </IntlContext>
  )
}
