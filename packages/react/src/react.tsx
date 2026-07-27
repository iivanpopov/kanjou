import type { Context, ReactNode } from 'react'

import { createContext, use, useMemo, useRef } from 'react'

import type { Translate, TranslateParts } from './translate'
import type { Functions, Locale, Message, MessageFormatOptions } from './types'

import { createCache } from './cache'
import { createFormatters } from './formatters'
import { createTranslateParts, createTranslate } from './translate'

export interface KanjouContextValue extends ReturnType<typeof createFormatters> {
  locale: Locale
  t: Translate
  parts: TranslateParts
}

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
    () => ({
      locale,
      t: createTranslate(cacheRef.current, messages, locale, _options),
      parts: createTranslateParts(cacheRef.current, messages, locale, _options),
      ...createFormatters(cacheRef.current, locale),
    }),
    [locale, messages],
  )

  return <KanjouContext value={contextValue}>{children}</KanjouContext>
}

export interface UseKanjouReturn extends ReturnType<typeof createFormatters> {
  locale: Locale
  t: Translate
  parts: TranslateParts
}

export function useKanjou(): UseKanjouReturn {
  return use(KanjouContext)
}
