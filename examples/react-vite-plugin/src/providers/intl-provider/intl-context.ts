import type { Locale, Message } from '@kanjou/react'

import { createContext } from 'react'

export interface IntlContextValue {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
  messages: Record<string, Message>
  setMessages: (messages: Record<string, Message>) => void
}

export const IntlContext = createContext<IntlContextValue>(null!)
