import type { MessagePart } from 'messageformat'

import { MessageFormat } from 'messageformat'

import type { Cache } from './cache'
import type {
  DateLike,
  Duration,
  FormatDateTimeOptions,
  FormatDisplayNameOptions,
  FormatDurationOptions,
  FormatListOptions,
  FormatNumberOptions,
  FormatPluralOptions,
  FormatRelativeTimeOptions,
  InferPartsType,
  ListLike,
  Locale,
  Message,
  MessageFormatOptions,
  MessageId,
  MessageValues,
  NumberLike,
  PluralRule,
  Unit,
} from './types'

function getKey(locale: string, options?: unknown): string {
  return options ? `${locale}:${JSON.stringify(options)}` : locale
}

export function formatMessage<Id extends string = MessageId>(
  cache: Cache,
  locale: Locale,
  messages: Record<string, Message>,
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

export function formatMessageParts<Id extends string = MessageId>(
  cache: Cache,
  locale: Locale,
  messages: Record<string, Message>,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[] {
  const message = messages[id]
  if (!message) return []

  const formatter = cache.getOrInsertComputed(
    `${locale}:${id}`,
    () => new MessageFormat(locale, message, options as any),
  )

  return formatter.formatToParts(values)
}

export function formatDateTime(
  cache: Cache,
  locale: Locale,
  date: DateLike,
  options?: FormatDateTimeOptions,
): string {
  const key = getKey(locale, options)
  const formatter = cache.getOrInsertComputed(key, () => new Intl.DateTimeFormat(locale, options))
  return formatter.format(date)
}

export function formatNumber(
  cache: Cache,
  locale: Locale,
  number: NumberLike,
  options?: FormatNumberOptions,
): string {
  const key = getKey(locale, options)
  const formatter = cache.getOrInsertComputed(key, () => new Intl.NumberFormat(locale, options))
  return formatter.format(number)
}

export function formatPlural(
  cache: Cache,
  locale: Locale,
  number: number,
  options?: FormatPluralOptions,
): PluralRule {
  const key = getKey(locale, options)
  const formatter = cache.getOrInsertComputed(key, () => new Intl.PluralRules(locale, options))
  return formatter.select(number)
}

export function formatList(
  cache: Cache,
  locale: Locale,
  list: ListLike,
  options?: FormatListOptions,
): string {
  const key = getKey(locale, options)
  const formatter = cache.getOrInsertComputed(key, () => new Intl.ListFormat(locale, options))
  return formatter.format(list)
}

export function formatDisplayName(
  cache: Cache,
  locale: Locale,
  code: string,
  options: FormatDisplayNameOptions,
): string | undefined {
  const key = getKey(locale, options)
  const formatter = cache.getOrInsertComputed(key, () => new Intl.DisplayNames(locale, options))
  return formatter.of(code)
}

export function formatRelativeTime(
  cache: Cache,
  locale: Locale,
  value: number,
  unit: Unit,
  options?: FormatRelativeTimeOptions,
): string {
  const key = getKey(locale, options)
  const formatter = cache.getOrInsertComputed(
    key,
    () => new Intl.RelativeTimeFormat(locale, options),
  )
  return formatter.format(value, unit)
}

export function formatDuration(
  cache: Cache,
  locale: Locale,
  duration: Duration,
  options?: FormatDurationOptions,
): string {
  const key = getKey(locale, options)
  const formatter = cache.getOrInsertComputed(key, () => new Intl.DurationFormat(locale, options))
  return formatter.format(duration)
}
