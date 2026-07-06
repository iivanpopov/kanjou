import type { Locale } from '@kanjou/react'

import { createContext } from 'react'

export interface IntlContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Record<string, any>
  setMessages: (messages: Record<string, any>) => void
}

export const IntlContext = createContext<IntlContextValue>(null!)
