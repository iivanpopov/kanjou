import type { MessagePart } from 'messageformat'

import type {
  Locale,
  MessageId,
  MessageValues,
  MessageFormatOptions,
  InferPartsType,
  Message,
} from '../types'
import type { Formatters } from './index'

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
