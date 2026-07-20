import type { MessageFormatOptions, MessagePart } from 'messageformat'

import { MessageFormat } from 'messageformat'

import type {
  Locale,
  Message,
  MessageKey,
  DefaultMessageType,
  MessageValue,
  MessageValues,
  DefaultPartType,
} from './types'

export interface TranslateParts<PartType extends string = DefaultPartType> {
  <Key extends MessageKey>(key: Key, values?: MessageValues<Key>): MessagePart<PartType>[]
  unsafe: (key: string, values?: Record<string, MessageValue>) => MessagePart<PartType>[]
}

export interface Translate<
  _MessageType extends string = DefaultMessageType,
  PartType extends string = DefaultPartType,
> {
  <Key extends MessageKey>(key: Key, values?: MessageValues<Key>): string
  unsafe: (key: string, values?: Record<string, MessageValue>) => string
  parts: TranslateParts<PartType>
}

const cache: Map<string, MessageFormat<string, string>> = new Map()

function translate<Key extends MessageKey>(
  messages: Record<string, Message>,
  locale: Locale,
  key: Key,
  values?: MessageValues<Key>,
  options?: MessageFormatOptions<string, string>,
): string {
  const message = messages[key]
  if (!message) return key

  const cacheKey = `${locale}:${key}`

  const formatter = cache.getOrInsert(cacheKey, new MessageFormat(locale, message, options))

  return formatter.format(values)
}

function translateToParts<Key extends MessageKey, PartType extends string = DefaultPartType>(
  messages: Record<string, Message>,
  locale: Locale,
  key: Key,
  values?: MessageValues<Key>,
  options?: MessageFormatOptions<string, string>,
): MessagePart<PartType>[] {
  const message = messages[key]
  if (!message) return [{ type: 'text', value: key }]

  const cacheKey = `${locale}:${key}`

  const formatter = cache.getOrInsert(cacheKey, new MessageFormat(locale, message, options))

  return formatter.formatToParts(values) as MessagePart<PartType>[]
}

export function createTranslate<
  MessageType extends string = DefaultMessageType,
  PartType extends string = DefaultPartType,
>(
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions<string, string>,
): Translate<MessageType, PartType> {
  const t: Translate<MessageType, PartType> = (key, values) =>
    translate(messages, locale, key, values, options)
  t.unsafe = (key, values) => translate(messages, locale, key, values, options)

  const parts: TranslateParts<PartType> = (key, values) =>
    translateToParts(messages, locale, key, values, options)
  parts.unsafe = (key, values) => translateToParts(messages, locale, key, values, options)

  t.parts = parts

  return t
}
