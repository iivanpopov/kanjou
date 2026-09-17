import type { Functions, Locale, Message, MessageFormatOptions } from '@kanjou/core'
import type { Context, ReactNode } from 'react'

import { createTranslateCache, createTranslate } from '@kanjou/core'
import { createContext, use, useMemo, useState } from 'react'

import type { ReactTranslate } from './enrich'
import type { Components } from './rich'

import { enrich } from './enrich'

export * from './enrich'

export const TranslateContext: Context<ReactTranslate> = createContext({} as ReactTranslate)

export interface TranslateProviderProps {
  children: ReactNode
  locale: Locale
  messages: Record<string, Message>
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: Functions
  components?: Components
}

export function TranslateProvider({
  children,
  functions,
  options,
  locale,
  messages,
  components,
}: TranslateProviderProps): ReactNode {
  const [cache] = useState(() => createTranslateCache())

  const translate = useMemo(
    () =>
      enrich(
        createTranslate({ locale, messages, cache, options: { ...options, functions } }),
        components,
      ),
    [locale, messages],
  )

  return <TranslateContext value={translate}>{children}</TranslateContext>
}

export function useTranslate(): ReactTranslate {
  return use(TranslateContext)
}
