import type { Functions, Locale, Message, MessageFormatOptions } from '@kanjou/core'
import type { ReactNode, Context } from 'react'

import { createContext, useMemo } from 'react'

import type { Components } from './rich'

export interface KanjouContextValue {
  locale: Locale
  messages: Record<string, Message>
  options?: MessageFormatOptions
  components?: Components
}

export const KanjouContext: Context<KanjouContextValue> = createContext({} as KanjouContextValue)

export interface KanjouProviderProps {
  children: ReactNode
  locale: Locale
  messages: Record<string, Message>
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: Functions
  components?: Components
}

export function KanjouProvider({
  children,
  functions,
  options,
  locale,
  messages,
  components,
}: KanjouProviderProps): ReactNode {
  const contextValue = useMemo(
    () => ({ locale, messages, components, options: { ...options, functions } }),
    [locale],
  )

  return <KanjouContext value={contextValue}>{children}</KanjouContext>
}
