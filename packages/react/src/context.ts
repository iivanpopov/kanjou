import type { Context } from 'react'

import { createContext } from 'react'

import type { InternalMessages, Locale } from './types'

export interface I18nContextValue {
  locale: Locale
  messages: InternalMessages
}

export const I18nContext: Context<I18nContextValue> = createContext({
  locale: '',
  messages: {},
})
