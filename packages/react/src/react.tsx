import type { Context, ReactNode } from 'react'

import { createContext, use, useMemo, useRef } from 'react'

import type { KanjouInstance } from './instance'
import type { Functions, Message, MessageFormatOptions } from './types'

import { createCache } from './cache'
import { createKanjouInstance } from './instance'

export type KanjouContextValue = KanjouInstance

export const KanjouContext: Context<KanjouContextValue> = createContext({} as KanjouContextValue)

export interface KanjouProviderProps {
  children: ReactNode
  locale: string
  messages: Record<string, Message>
  functions?: Functions
  options?: Omit<MessageFormatOptions, 'functions'>
}

export function KanjouProvider({
  children,
  functions,
  options,
  locale,
  messages,
}: KanjouProviderProps): ReactNode {
  const cacheRef = useRef(createCache())
  const _options = useMemo(() => ({ ...options, functions }), [])

  const contextValue = useMemo(
    () => createKanjouInstance(cacheRef.current, messages, locale, _options),
    [locale, messages],
  )

  return <KanjouContext value={contextValue}>{children}</KanjouContext>
}

export type UseKanjouReturn = KanjouInstance

export function useKanjou(): UseKanjouReturn {
  return use(KanjouContext)
}
