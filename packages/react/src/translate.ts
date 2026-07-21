import type { MessageFormatOptions, MessagePart } from 'messageformat'

import { MessageFormat } from 'messageformat'

import type {
  Locale,
  Message,
  MessageKey,
  RegisteredMessageType,
  MessageValue,
  MessageValues,
  RegisteredPartType,
} from './types'

export interface TranslateToParts<PartType extends string = RegisteredPartType> {
  <Key extends MessageKey>(key: Key, values?: MessageValues<Key>): MessagePart<PartType>[]
  unsafe: (key: string, values?: Record<string, MessageValue>) => MessagePart<PartType>[]
}

export interface Translate<
  _MessageType extends string = RegisteredMessageType,
  PartType extends string = RegisteredPartType,
> {
  <Key extends MessageKey>(key: Key, values?: MessageValues<Key>): string
  unsafe: (key: string, values?: Record<string, MessageValue>) => string
  parts: TranslateToParts<PartType>
}

const cache: Map<string, MessageFormat<string, string>> = new Map()

function translate<Key extends MessageKey>(
  messages: Record<string, Message>,
  locale: Locale,
  key: Key,
  values?: MessageValues<Key>,
  options?: MessageFormatOptions<string, string>,
  ignoreCache?: boolean,
): string {
  const message = messages[key]
  if (!message) return key

  if (ignoreCache) return new MessageFormat(locale, message, options).format(values)

  const formatter = cache.getOrInsert(
    `${locale}:${key}`,
    new MessageFormat(locale, message, options),
  )

  return formatter.format(values)
}

function translateToParts<Key extends MessageKey, PartType extends string = RegisteredPartType>(
  messages: Record<string, Message>,
  locale: Locale,
  key: Key,
  values?: MessageValues<Key>,
  options?: MessageFormatOptions<string, string>,
  ignoreCache?: boolean,
): MessagePart<PartType>[] {
  const message = messages[key]
  if (!message) return [{ type: 'text', value: key }]

  if (ignoreCache) {
    return new MessageFormat(locale, message, options).formatToParts(
      values,
    ) as MessagePart<PartType>[]
  }

  const formatter = cache.getOrInsert(
    `${locale}:${key}`,
    new MessageFormat(locale, message, options),
  )

  return formatter.formatToParts(values) as MessagePart<PartType>[]
}

export function createTranslate<
  MessageType extends string = RegisteredMessageType,
  PartType extends string = RegisteredPartType,
>(
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions<string, string>,
  ignoreCache: boolean = false,
): Translate<MessageType, PartType> {
  const t: Translate<MessageType, PartType> = (key, values) =>
    translate(messages, locale, key, values, options, ignoreCache)
  t.unsafe = (key, values) => translate(messages, locale, key, values, options, ignoreCache)

  const parts: TranslateToParts<PartType> = (key, values) =>
    translateToParts(messages, locale, key, values, options, ignoreCache)
  parts.unsafe = (key, values) =>
    translateToParts(messages, locale, key, values, options, ignoreCache)

  t.parts = parts

  return t
}
