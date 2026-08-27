import type { Functions, Message, MessageFormatOptions } from '@kanjou/core'
import type { ElementType, ReactNode, Context } from 'react'

import { createContext, useMemo } from 'react'

export interface KanjouContextValue {
  locale: string
  messages: Record<string, Message>
  options?: MessageFormatOptions
  components?: Record<string, ElementType>
}

export const KanjouContext: Context<KanjouContextValue> = createContext({} as KanjouContextValue)

export interface KanjouProviderProps {
  children: ReactNode
  locale: string
  messages: Record<string, Message>
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: Functions
  components?: Record<string, ElementType>
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
