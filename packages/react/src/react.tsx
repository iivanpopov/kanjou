import type { Context, ReactNode } from 'react'

import { createContext, use } from 'react'

import type { Translate } from './translate'
import type { Messages, Locale } from './types'

import { translate } from './translate'

export interface I18nContextValue {
  locale: Locale
  messages: Messages
}

export const I18nContext: Context<I18nContextValue> = createContext({ locale: '', messages: {} })

interface IntlProviderProps {
  children: ReactNode
  locale: string
  messages: Messages
}

export function I18nProvider({ children, messages, locale }: IntlProviderProps): ReactNode {
  return <I18nContext value={{ locale, messages }}>{children}</I18nContext>
}

export interface UseI18nReturn {
  locale: Locale
  t: Translate
}

export function useI18n(): UseI18nReturn {
  const { locale, messages } = use(I18nContext)

  const t: Translate = (key, values) => translate(messages, locale, key, values)

  return { locale, t }
}
