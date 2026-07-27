import type { MessagePart } from 'messageformat'

import { MessageFormat } from 'messageformat'

import type { KanjouCache } from './cache'
import type {
  Locale,
  Message,
  MessageKey,
  MessageValues,
  MessageFormatOptions,
  InferPartsType,
} from './types'

export interface TranslateParts {
  <Key extends MessageKey>(
    key: Key,
    values?: MessageValues<Key>,
  ): MessagePart<InferPartsType<Key>>[]
  unsafe: (key: any, values?: Record<string, any>) => MessagePart<string>[]
}

export interface Translate {
  <Key extends MessageKey>(key: Key, values?: MessageValues<Key>): string
  unsafe: (key: any, values?: Record<string, any>) => string
}

function translate<Key extends MessageKey>(
  cache: KanjouCache,
  messages: Record<string, Message>,
  locale: Locale,
  key: Key,
  values?: MessageValues<Key>,
  options?: MessageFormatOptions,
): string {
  const message = messages[key]
  if (!message) return key

  const formatter = cache.messages.getOrInsert(
    `${locale}:${key}`,
    new MessageFormat(locale, message, options as any),
  )

  return formatter.format(values)
}

function translateParts<Key extends MessageKey>(
  cache: KanjouCache,
  messages: Record<string, Message>,
  locale: Locale,
  key: Key,
  values?: MessageValues<Key>,
  options?: MessageFormatOptions,
): MessagePart<InferPartsType<Key>>[] {
  const message = messages[key]
  if (!message) return [{ type: 'text', value: key }]

  const formatter = cache.messages.getOrInsert(
    `${locale}:${key}`,
    new MessageFormat(locale, message, options as any),
  )

  return formatter.formatToParts(values) as MessagePart<InferPartsType<Key>>[]
}

export function createTranslate(
  cache: KanjouCache,
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions,
): Translate {
  const t: Translate = (key, values) => translate(cache, messages, locale, key, values, options)
  t.unsafe = (key, values) => translate(cache, messages, locale, key, values, options)

  return t
}

export function createTranslateParts(
  cache: KanjouCache,
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions,
): TranslateParts {
  const parts: TranslateParts = (key, values) =>
    translateParts(cache, messages, locale, key, values, options)
  parts.unsafe = (key, values) => translateParts(cache, messages, locale, key, values, options)

  return parts
}
