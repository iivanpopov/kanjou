import type { Locale } from '@kanjou/react'

import { createContext } from 'react'

export interface IntlContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Record<string, string>
  setMessages: (messages: Record<string, string>) => void
}

export const IntlContext = createContext<IntlContextValue>(null!)
