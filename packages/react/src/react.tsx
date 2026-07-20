import type { MessageFormatOptions } from 'messageformat'
import type { Context, ReactNode } from 'react'

import { createContext, use } from 'react'

import type { Translate } from './translate'
import type {
  InferMessageType,
  InferPartType,
  Locale,
  Message,
  DefaultMessageType,
  DefaultPartType,
  MessageFormatFunctions,
} from './types'

import { createTranslate } from './translate'

export interface I18nContextValue {
  locale: Locale
  functions?: MessageFormatFunctions
  options?: Omit<MessageFormatOptions, 'functions'>
  messages: Record<string, Message>
}

const I18nContext: Context<I18nContextValue> = createContext<I18nContextValue>({
  locale: '',
  messages: {},
})

export interface I18nProviderProps {
  children: ReactNode
  locale: string
  messages: Record<string, Message>
  functions?: MessageFormatFunctions
  options?: Omit<MessageFormatOptions, 'functions'>
}

export function I18nProvider({
  children,
  messages,
  locale,
  functions,
  options,
}: I18nProviderProps): ReactNode {
  return <I18nContext value={{ locale, messages, functions, options }}>{children}</I18nContext>
}

export interface UseI18nOptions<Functions extends MessageFormatFunctions = MessageFormatFunctions> {
  functions?: Functions
  options?: Omit<MessageFormatOptions<string, string>, 'functions'>
}

export interface UseI18nReturn<
  MessageType extends string = DefaultMessageType,
  PartType extends string = DefaultPartType,
> {
  locale: Locale
  t: Translate<MessageType, PartType>
}

export function useI18n<
  Functions extends MessageFormatFunctions = undefined,
  MessageType extends string = InferMessageType<Functions> | DefaultMessageType,
  PartType extends string = InferPartType<Functions> | DefaultPartType,
>(options?: UseI18nOptions<Functions>): UseI18nReturn<MessageType, PartType> {
  const context = use(I18nContext)
  const locale = context.locale
  const messages = context.messages

  const mergedFunctions = Object.assign({}, context.functions, options?.functions)
  const mergedOptions = Object.assign({}, context.options, options?.options)
  const translateOptions = Object.assign({}, mergedOptions, { functions: mergedFunctions })

  const t = createTranslate<MessageType, PartType>(messages, locale, translateOptions)

  return { locale, t }
}
