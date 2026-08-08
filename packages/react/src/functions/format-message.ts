import type { MessagePart } from 'messageformat'

import { MessageFormat } from 'messageformat'

import type { KanjouCache } from '../cache'
import type {
  Locale,
  Message,
  MessageId,
  MessageValues,
  MessageFormatOptions,
  InferPartsType,
} from '../types'

export interface FormatMessage {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): string
  unsafe: (id: any, values?: Record<string, any>) => string
}

function formatMessage<Id extends MessageId>(
  cache: KanjouCache['messages'],
  messages: Record<string, Message>,
  locale: Locale,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): string {
  const message = messages[id]
  if (!message) return id

  const formatter = cache.getOrInsertComputed(
    `${locale}:${id}`,
    () => new MessageFormat(locale, message, options as any),
  )

  return formatter.format(values)
}

export interface FormatMessageParts {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): MessagePart<InferPartsType<Id>>[]
  unsafe: (id: any, values?: Record<string, any>) => MessagePart<string>[]
}

export function createFormatMessage(
  cache: KanjouCache['messages'],
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions,
): FormatMessage {
  const t: FormatMessage = (id, values) =>
    formatMessage(cache, messages, locale, id, values, options)
  t.unsafe = (id, values) => formatMessage(cache, messages, locale, id, values, options)

  return t
}
