import type { ReactNode } from 'react'

import type { Messages } from './types'

import { I18nContext } from './context'

interface IntlProviderProps {
  children: ReactNode
  locale: string
  messages: Messages
}

export function I18nProvider({ children, messages, locale }: IntlProviderProps): ReactNode {
  return <I18nContext value={{ locale, messages }}>{children}</I18nContext>
}
