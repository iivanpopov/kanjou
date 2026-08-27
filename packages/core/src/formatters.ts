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

export type DateLike = number | Date | Intl.FormattableTemporalObject
export type FormatDateTimeOptions = Intl.DateTimeFormatOptions

export function formatDateTime(
  locale: Locale,
  date: DateLike,
  options?: FormatDateTimeOptions,
): string {
  return get(Intl.DateTimeFormat, locale, options).format(date)
}

export type NumberLike = number | bigint | Intl.StringNumericLiteral
export type FormatNumberOptions = Intl.NumberFormatOptions

export function formatNumber(
  locale: Locale,
  number: NumberLike,
  options?: FormatNumberOptions,
): string {
  return get(Intl.NumberFormat, locale, options).format(number)
}

export type FormatPluralOptions = Intl.PluralRulesOptions

export function formatPlural(
  locale: Locale,
  number: number,
  options?: FormatPluralOptions,
): Intl.LDMLPluralRule {
  return get(Intl.PluralRules, locale, options).select(number)
}

export type ListLike = Iterable<string>
export type FormatListOptions = Intl.ListFormatOptions

export function formatList(locale: Locale, list: ListLike, options?: FormatListOptions): string {
  return get(Intl.ListFormat, locale, options).format(list)
}

export type FormatDisplayNameOptions = Intl.DisplayNamesOptions

export function formatDisplayName(
  locale: Locale,
  code: string,
  options: FormatDisplayNameOptions,
): string | undefined {
  return get(Intl.DisplayNames, locale, options).of(code)
}

export type Unit = Intl.RelativeTimeFormatUnit
export type FormatRelativeTimeOptions = Intl.RelativeTimeFormatOptions

export function formatRelativeTime(
  locale: Locale,
  value: number,
  unit: Unit,
  options?: FormatRelativeTimeOptions,
): string {
  return get(Intl.RelativeTimeFormat, locale, options).format(value, unit)
}

export type Duration = Parameters<Intl.DurationFormat['format']>[0]
export type FormatDurationOptions = Intl.DurationFormatOptions

export function formatDuration(
  locale: Locale,
  duration: Duration,
  options?: FormatDurationOptions,
): string {
  return get(Intl.DurationFormat, locale, options).format(duration)
}
