import type { Functions, Message, MessageFormatOptions, KanjouCache } from '@kanjou/core'
import type { Formatters } from '@kanjou/core'
import type { ElementType, ReactNode, Context } from 'react'

import { createCache, createFormatters } from '@kanjou/core'
import { createContext, use, useMemo } from 'react'

export interface KanjouContextValue {
  locale: string
  messages: Record<string, Message>
  options?: MessageFormatOptions
  cache: KanjouCache
  formatters: Formatters
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
  const _options = useMemo(() => ({ ...options, functions }), [])
  const cache = useMemo(() => createCache(), [])
  const formatters = useMemo(() => createFormatters(cache), [])

  const contextValue = useMemo(
    () => ({
      locale,
      messages,
      options: _options,
      cache,
      formatters,
      components,
    }),
    [locale],
  )

  return <KanjouContext value={contextValue}>{children}</KanjouContext>
}

export function useKanjouContext(): KanjouContextValue {
  return use(KanjouContext)
}
