import type {
  Locale,
  Message,
  MessageFormatOptions,
  MessageFunctions,
  TranslateCache,
} from '@kanjou/core'
import type { Context, ReactNode } from 'react'

import { createTranslate } from '@kanjou/core'
import { createContext, use, useMemo } from 'react'

import type { ReactTranslate } from './enrich'
import type { Components } from './rich'

import { enrich } from './enrich'

export * from './enrich'

const DEFAULT_TRANSLATE = {} as ReactTranslate

export const TranslateContext: Context<ReactTranslate> = createContext(DEFAULT_TRANSLATE)

interface TranslateProviderState {
  locale: Locale
  messages: Readonly<Record<string, Message>>
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: MessageFunctions
  components?: Components
  cache?: TranslateCache
}

const TranslateProviderContext: Context<TranslateProviderState | null> =
  createContext<TranslateProviderState | null>(null)

export interface TranslateProviderProps {
  locale?: Locale
  messages: Readonly<Record<string, Message>>
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: MessageFunctions
  components?: Components
  cache?: TranslateCache
  children: ReactNode
}

function mergeRecord<T extends object>(parent?: T, child?: T): T | undefined {
  if (!parent) return child
  if (!child) return parent
  return { ...parent, ...child }
}

export function TranslateProvider({
  children,
  functions,
  options,
  locale,
  messages,
  components,
  cache,
}: TranslateProviderProps): ReactNode {
  const parent = use(TranslateProviderContext)
  const resolvedLocale = locale ?? parent?.locale

  if (!resolvedLocale) {
    throw new Error(
      'TranslateProvider requires a `locale` prop when not nested inside another TranslateProvider.',
    )
  }

  const parentMessages = parent?.messages
  const parentFunctions = parent?.functions
  const parentComponents = parent?.components

  const mergedMessages = useMemo(
    () => (parentMessages ? { ...parentMessages, ...messages } : messages),
    [parentMessages, messages],
  )
  const mergedFunctions = useMemo(
    () => mergeRecord(parentFunctions, functions),
    [parentFunctions, functions],
  )
  const mergedComponents = useMemo(
    () => mergeRecord(parentComponents, components),
    [parentComponents, components],
  )

  const resolvedOptions = options ?? parent?.options
  const resolvedCache = cache ?? parent?.cache

  const providerState = useMemo<TranslateProviderState>(
    () => ({
      locale: resolvedLocale,
      messages: mergedMessages,
      options: resolvedOptions,
      functions: mergedFunctions,
      components: mergedComponents,
      cache: resolvedCache,
    }),
    [
      resolvedLocale,
      mergedMessages,
      resolvedOptions,
      mergedFunctions,
      mergedComponents,
      resolvedCache,
    ],
  )

  const translate = useMemo(() => {
    const translateOptions =
      resolvedOptions || mergedFunctions
        ? { ...resolvedOptions, functions: mergedFunctions }
        : undefined
    return enrich(
      createTranslate({
        locale: resolvedLocale,
        messages: mergedMessages,
        cache: resolvedCache,
        options: translateOptions,
      }),
      mergedComponents,
    )
  }, [
    resolvedLocale,
    mergedMessages,
    resolvedCache,
    resolvedOptions,
    mergedFunctions,
    mergedComponents,
  ])

  return (
    <TranslateProviderContext value={providerState}>
      <TranslateContext value={translate}>{children}</TranslateContext>
    </TranslateProviderContext>
  )
}

export function useTranslate(): ReactTranslate {
  const translate = use(TranslateContext)
  if (translate === DEFAULT_TRANSLATE) {
    throw new Error('useTranslate() must be used inside a <TranslateProvider>.')
  }
  return translate
}
