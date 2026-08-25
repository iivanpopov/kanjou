import type { Context, ReactNode } from 'react'

import { createContext, use, useMemo } from 'react'

import type { KanjouInstance } from './instance'
import type { Functions, Message, MessageFormatOptions } from './types'

import { createCache } from './cache'
import { createKanjouInstance } from './instance'

export const KanjouContext: Context<KanjouInstance> = createContext({} as KanjouInstance)

export interface KanjouProviderProps {
  children: ReactNode
  locale: string
  messages: Record<string, Message>
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: Functions
}

export function KanjouProvider({
  children,
  functions,
  options,
  locale,
  messages,
}: KanjouProviderProps): ReactNode {
  const _options = useMemo(() => ({ ...options, functions }), [])

  const cache = useMemo(() => createCache(), [])

  const contextValue = useMemo(
    () => createKanjouInstance(cache, messages, locale, _options),
    [locale],
  )

  return <KanjouContext value={contextValue}>{children}</KanjouContext>
}

export function useKanjou(): KanjouInstance {
  return use(KanjouContext)
}
