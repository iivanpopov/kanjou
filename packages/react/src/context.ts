import type { Context } from 'react'

import { createContext } from 'react'

export interface I18nContextValue {
  messages: Record<string, any>
  locale: string
}

export const I18nContext: Context<I18nContextValue> = createContext({
  messages: {},
  locale: '',
})
