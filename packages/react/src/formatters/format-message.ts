import type { MessagePart } from 'messageformat'

import type {
  Locale,
  Message,
  MessageId,
  MessageValues,
  MessageFormatOptions,
  InferPartsType,
} from '../types'
import type { Formatters } from './index'

export interface FormatMessage {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): string
  unsafe: (id: any, values?: Record<string, any>) => string
}

export function formatMessage<Id extends MessageId>(
  getMessageFormat: Formatters['getMessageFormat'],
  messages: Record<string, Message>,
  locale: Locale,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): string {
  const message = messages[id]
  if (!message) return id

  const formatter = getMessageFormat(locale, message, options)

  return formatter.format(values)
}

export function createFormatMessage(
  getMessageFormat: Formatters['getMessageFormat'],
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions,
): FormatMessage {
  const t: FormatMessage = (id, values) =>
    formatMessage(getMessageFormat, messages, locale, id, values, options)
  t.unsafe = (id, values) => formatMessage(getMessageFormat, messages, locale, id, values, options)

  return t
}

export interface FormatMessageParts {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): MessagePart<InferPartsType<Id>>[]
  unsafe: (id: any, values?: Record<string, any>) => MessagePart<string>[]
}

export function formatMessageParts<Id extends MessageId>(
  getMessageFormat: Formatters['getMessageFormat'],
  messages: Record<string, Message>,
  locale: Locale,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): MessagePart<InferPartsType<Id>>[] {
  const message = messages[id]
  if (!message) return []

  const formatter = getMessageFormat(locale, message, options)

  return formatter.formatToParts(values)
}

export function createFormatMessageParts(
  getMessageFormat: Formatters['getMessageFormat'],
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions,
): FormatMessageParts {
  const t: FormatMessageParts = (id, values) =>
    formatMessageParts(getMessageFormat, messages, locale, id, values, options)
  t.unsafe = (id, values) =>
    formatMessageParts(getMessageFormat, messages, locale, id, values, options)

  return t
}
