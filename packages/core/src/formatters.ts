import type { MessagePart } from 'messageformat'

import { MessageFormat } from 'messageformat'

import type {
  InferPartsType,
  Locale,
  Message,
  MessageFormatOptions,
  MessageId,
  MessageValues,
} from './types'

import { get } from './cache'

export function formatMessage<Id extends MessageId>(
  locale: Locale,
  messages: Record<string, Message>,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): string {
  const message = messages[id]
  if (!message) return id

  const formatter = get(MessageFormat, locale, message, options as any)

  return formatter.format(values)
}

export function formatMessageParts<Id extends MessageId>(
  locale: Locale,
  messages: Record<string, Message>,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): MessagePart<InferPartsType<Id>>[] {
  const message = messages[id]
  if (!message) return []

  const formatter = get(MessageFormat, locale, message, options as any)

  return formatter.formatToParts(values) as MessagePart<InferPartsType<Id>>[]
}

export function formatDate(
  locale: Locale,
  date: number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return get(Intl.DateTimeFormat, locale, options).format(date)
}

export function formatTime(
  locale: Locale,
  date: number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return get(Intl.DateTimeFormat, locale, options).format(date)
}

export function formatNumber(
  locale: Locale,
  number: number | bigint | Intl.StringNumericLiteral,
  options?: Intl.NumberFormatOptions,
): string {
  return get(Intl.NumberFormat, locale, options).format(number)
}

export function formatPlural(
  locale: Locale,
  n: number,
  options?: Intl.PluralRulesOptions,
): Intl.LDMLPluralRule {
  return get(Intl.PluralRules, locale, options).select(n)
}

export function formatList(
  locale: Locale,
  list: Iterable<string>,
  options?: Intl.ListFormatOptions,
): string {
  return get(Intl.ListFormat, locale, options).format(list)
}

export function formatDisplayName(
  locale: Locale,
  code: string,
  options: Intl.DisplayNamesOptions,
): string | undefined {
  return get(Intl.DisplayNames, locale, options).of(code)
}

export function formatRelativeTime(
  locale: Locale,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): string {
  return get(Intl.RelativeTimeFormat, locale, options).format(value, unit)
}

export type Duration = Parameters<Intl.DurationFormat['format']>[0]

export function formatDuration(
  locale: Locale,
  duration: Duration,
  options?: Intl.DurationFormatOptions,
): string {
  return get(Intl.DurationFormat, locale, options).format(duration)
}
