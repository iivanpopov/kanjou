import { createContext } from 'react'

export type Locale = 'en' | 'es' | 'fr'

export interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
}

export const LocaleContext = createContext<LocaleContextValue>(null!)
