import type { Context, ReactNode } from 'react'

import { createContext, use, useMemo, useRef } from 'react'

import type { KanjouInstance } from './instance'
import type { RichComponent } from './rich'
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
  components?: Record<string, RichComponent>
}

export function KanjouProvider({
  children,
  functions,
  components,
  options,
  locale,
  messages,
}: KanjouProviderProps): ReactNode {
  const cacheRef = useRef(createCache())
  const _options = useMemo(() => ({ ...options, functions }), [])

  const contextValue = useMemo(
    () =>
      cacheRef.current.instances.getOrInsertComputed(locale, () =>
        createKanjouInstance(cacheRef.current, messages, locale, _options, components),
      ),
    [locale, messages],
  )

  return <KanjouContext value={contextValue}>{children}</KanjouContext>
}

export function useKanjou(): KanjouInstance {
  return use(KanjouContext)
}
