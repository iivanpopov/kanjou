import type { MessageFormatOptions } from 'messageformat'

import type { Translate } from './translate'
import type {
  Locale,
  Message,
  RegisteredMessageType,
  RegisteredPartType,
  MessageFormatFunctions,
} from './types'

import { createTranslate } from './translate'

export interface CreateI18nOptions {
  locale: Locale
  messages: Record<string, Message>
  functions?: MessageFormatFunctions
  options?: Omit<MessageFormatOptions<string, string>, 'functions'>
}

export interface CreateI18nReturn<
  MessageType extends string = RegisteredMessageType,
  PartType extends string = RegisteredPartType,
> {
  t: Translate<MessageType, PartType>
}

// fix: potential cache issues (more than just fix: figure out new API)
export function createI18n<
  MessageType extends string = RegisteredMessageType,
  PartType extends string = RegisteredPartType,
>({
  messages,
  locale,
  functions,
  options,
}: CreateI18nOptions): CreateI18nReturn<MessageType, PartType> {
  const opts = functions || options ? { ...options, functions } : undefined
  const t = createTranslate<MessageType, PartType>(messages, locale, opts)

  return { t }
}
