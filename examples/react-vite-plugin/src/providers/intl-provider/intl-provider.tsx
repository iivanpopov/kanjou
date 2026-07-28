import type { Locale, Message } from '@kanjou/react'
import type { ReactNode } from 'react'

import { KanjouProvider } from '@kanjou/react'
import { useState } from 'react'

import { loader } from '#/utils/locale'

import { IntlContext } from './intl-context'

export function IntlProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode
  initialLocale: Locale
  initialMessages: Record<string, Message>
}) {
  const [_locale, _setLocale] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Record<string, Message>>(() => initialMessages)

  const setLocale = async (newLocale: Locale) => {
    const newMessages = await loader(newLocale)
    setMessages(newMessages)
    _setLocale(newLocale)
  }

  return (
    <IntlContext value={{ locale: _locale, setLocale, messages, setMessages }}>
      {/* kanjou provider only needs the current locale and raw messages object */}
      <KanjouProvider locale={_locale} messages={messages}>
        {children}
      </KanjouProvider>
    </IntlContext>
  )
}
