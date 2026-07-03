import type { ReactNode } from 'react'

import { I18nContext } from './context'

interface IntlProviderProps {
  children: ReactNode
  locale: string
  messages: Record<string, any>
}

export function I18nProvider({ children, messages, locale }: IntlProviderProps): ReactNode {
  return <I18nContext value={{ locale, messages }}>{children}</I18nContext>
}
