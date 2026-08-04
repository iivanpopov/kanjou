import type { MessagePart } from 'messageformat'

import { MessageFormat } from 'messageformat'

import type { KanjouCache } from '../cache'
import type {
  Locale,
  Message,
  MessageKey,
  MessageValues,
  MessageFormatOptions,
  InferPartsType,
} from '../types'

export interface FormatMessage {
  <Key extends MessageKey>(key: Key, values?: MessageValues<Key>): string
  unsafe: (key: any, values?: Record<string, any>) => string
}

function formatMessage<Key extends MessageKey>(
  cache: KanjouCache['messages'],
  messages: Record<string, Message>,
  locale: Locale,
  key: Key,
  values?: MessageValues<Key>,
  options?: MessageFormatOptions,
): string {
  const message = messages[key]
  if (!message) return key

  const formatter = cache.getOrInsertComputed(
    `${locale}:${key}`,
    () => new MessageFormat(locale, message, options as any),
  )

  return formatter.format(values)
}

export interface FormatMessageParts {
  <Key extends MessageKey>(
    key: Key,
    values?: MessageValues<Key>,
  ): MessagePart<InferPartsType<Key>>[]
  unsafe: (key: any, values?: Record<string, any>) => MessagePart<string>[]
}

export function createFormatMessage(
  cache: KanjouCache['messages'],
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions,
): FormatMessage {
  const t: FormatMessage = (key, values) =>
    formatMessage(cache, messages, locale, key, values, options)
  t.unsafe = (key, values) => formatMessage(cache, messages, locale, key, values, options)

  return t
}
