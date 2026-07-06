'use client'

import { createContext } from 'react'

export type Locale = 'en' | 'es' | 'fr'

export interface IntlContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  messages: Record<string, any>
  setMessages: (messages: Record<string, any>) => void
}

export const IntlContext = createContext<IntlContextValue>(null!)
