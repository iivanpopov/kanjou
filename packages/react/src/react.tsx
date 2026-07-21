import type { MessageFormatOptions } from 'messageformat'
import type { Context, ReactNode } from 'react'

import { createContext, use } from 'react'

import type { Translate } from './translate'
import type {
  InferMessageType,
  InferPartType,
  Locale,
  Message,
  RegisteredMessageType,
  RegisteredPartType,
  MessageFormatFunctions,
} from './types'

import { createTranslate } from './translate'

export interface KanjouContextValue {
  locale: Locale
  functions?: MessageFormatFunctions
  options?: Omit<MessageFormatOptions, 'functions'>
  messages: Record<string, Message>
}

export const KanjouContext: Context<KanjouContextValue> = createContext({
  locale: '',
  messages: {},
})

export interface KanjouProviderProps {
  children: ReactNode
  locale: string
  messages: Record<string, Message>
  functions?: MessageFormatFunctions
  options?: Omit<MessageFormatOptions, 'functions'>
}

export function KanjouProvider({
  children,
  messages,
  locale,
  functions,
  options,
}: KanjouProviderProps): ReactNode {
  return <KanjouContext value={{ locale, messages, functions, options }}>{children}</KanjouContext>
}

export interface UseI18nOptions<Functions extends MessageFormatFunctions = MessageFormatFunctions> {
  functions?: Functions
  options?: Omit<MessageFormatOptions<string, string>, 'functions'>
}

export interface UseI18nReturn<
  MessageType extends string = RegisteredMessageType,
  PartType extends string = RegisteredPartType,
> {
  locale: Locale
  t: Translate<MessageType, PartType>
}

export function useI18n<
  Functions extends MessageFormatFunctions = undefined,
  MessageType extends string = InferMessageType<Functions> | RegisteredMessageType,
  PartType extends string = InferPartType<Functions> | RegisteredPartType,
>({ functions, options }: UseI18nOptions<Functions> = {}): UseI18nReturn<MessageType, PartType> {
  const { locale, messages, ...context } = use(KanjouContext)

  const hasOptions = !!(functions ?? options)

  const opts =
    hasOptions || !!(context.functions ?? context.options)
      ? { ...context.options, ...options, functions: { ...context.functions, ...functions } }
      : undefined

  const t = createTranslate<MessageType, PartType>(messages, locale, opts, hasOptions)

  return { locale, t }
}
