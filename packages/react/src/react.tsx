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
import { KanjouReactError } from './errors'

export * from './enrich'

export const TranslateContext: Context<ReactTranslate | null> =
  createContext<ReactTranslate | null>(null)

interface TranslateProviderState {
  locale: Locale
  messages: Readonly<Record<string, Message>>
  options?: Omit<MessageFormatOptions, 'functions'> | undefined
  functions?: MessageFunctions | undefined
  components?: Components | undefined
  cache?: TranslateCache | undefined
}

const TranslateProviderContext: Context<TranslateProviderState | null> =
  createContext<TranslateProviderState | null>(null)

export interface TranslateProviderProps {
  locale?: Locale | undefined
  messages: Readonly<Record<string, Message>>
  options?: Omit<MessageFormatOptions, 'functions'> | undefined
  functions?: MessageFunctions | undefined
  components?: Components | undefined
  cache?: TranslateCache | undefined
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
    throw new KanjouReactError(
      'TranslateProvider requires a `locale` prop when not nested inside another TranslateProvider.',
    )
  }

  const parentMessages = parent?.messages
  const parentOptions = parent?.options
  const parentFunctions = parent?.functions
  const parentComponents = parent?.components

  const mergedMessages = useMemo(
    () => (parentMessages ? { ...parentMessages, ...messages } : messages),
    [parentMessages, messages],
  )
  const mergedOptions = useMemo(() => mergeRecord(parentOptions, options), [parentOptions, options])
  const mergedFunctions = useMemo(
    () => mergeRecord(parentFunctions, functions),
    [parentFunctions, functions],
  )
  const mergedComponents = useMemo(
    () => mergeRecord(parentComponents, components),
    [parentComponents, components],
  )

  const resolvedCache = cache ?? parent?.cache

  const providerState = useMemo<TranslateProviderState>(
    () => ({
      locale: resolvedLocale,
      messages: mergedMessages,
      options: mergedOptions,
      functions: mergedFunctions,
      components: mergedComponents,
      cache: resolvedCache,
    }),
    [
      resolvedLocale,
      mergedMessages,
      mergedOptions,
      mergedFunctions,
      mergedComponents,
      resolvedCache,
    ],
  )

  const translate = useMemo(() => {
    const translateOptions =
      mergedOptions || mergedFunctions
        ? { ...mergedOptions, functions: mergedFunctions }
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
    mergedOptions,
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
  if (!translate) {
    throw new KanjouReactError('useTranslate() must be used inside a <TranslateProvider>.')
  }
  return translate
}
