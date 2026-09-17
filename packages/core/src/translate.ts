import type { TranslateCache } from './cache'
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
  ListLike,
  MessageId,
  MessageValues,
  NumberLike,
  Unit,
  MessageFormatOptions,
  Message,
  Locale,
  MessagePart,
  InferPartsType,
  PluralRule,
} from './types'

import {
  formatDateTime,
  formatDisplayName,
  formatDuration,
  formatList,
  formatMessage,
  formatMessageParts,
  formatNumber,
  formatPlural,
  formatRelativeTime,
} from './formatters'

export interface CreateTranslateOptions {
  locale: Locale
  messages: Record<string, Message>
  cache: TranslateCache
  options?: MessageFormatOptions
}

export interface TranslateParts {
  (id: MessageId, values?: MessageValues): MessagePart<InferPartsType<MessageId>>[]
  unsafe: (id?: string, values?: Record<string, any>) => MessagePart<any>[]
}

export interface Translate {
  (id: MessageId, values?: MessageValues): string
  unsafe: (id?: string, values?: Record<string, any>) => string
  parts: TranslateParts
  number: (number: NumberLike, options?: FormatNumberOptions) => string
  date: (date: DateLike, options?: FormatDateTimeOptions) => string
  plural: (number: number, options?: FormatPluralOptions) => PluralRule
  list: (list: ListLike, options?: FormatListOptions) => string
  relative: (value: number, unit: Unit, options?: FormatRelativeTimeOptions) => string
  duration: (duration: Duration, options?: FormatDurationOptions) => string
  display: (code: string, options: FormatDisplayNameOptions) => string | undefined
  locale: Locale
  messages: Record<string, Message>
}

export function createTranslate({
  locale,
  messages,
  cache,
  options,
}: CreateTranslateOptions): Translate {
  const parts: TranslateParts = Object.assign(
    (id: MessageId, values?: MessageValues) =>
      formatMessageParts(cache.message, locale, messages, id, values, options),
    {
      unsafe: (id?: string, values?: Record<string, any>) =>
        formatMessageParts(cache.message, locale, messages, id ?? '', values, options),
    },
  )

  const translate: Translate = Object.assign(
    (id: MessageId, values?: MessageValues) =>
      formatMessage(cache.message, locale, messages, id, values, options),
    {
      unsafe: (id?: string, values?: Record<string, any>) =>
        formatMessage(cache.message, locale, messages, id ?? '', values, options),
      parts,
      number: (number: NumberLike, options?: FormatNumberOptions) =>
        formatNumber(cache.number, locale, number, options),
      date: (date: DateLike, options?: FormatDateTimeOptions) =>
        formatDateTime(cache.dateTime, locale, date, options),
      plural: (number: number, options?: FormatPluralOptions) =>
        formatPlural(cache.plural, locale, number, options),
      list: (list: ListLike, options?: FormatListOptions) =>
        formatList(cache.list, locale, list, options),
      relative: (value: number, unit: Unit, options?: FormatRelativeTimeOptions) =>
        formatRelativeTime(cache.relative, locale, value, unit, options),
      duration: (duration: Duration, options?: FormatDurationOptions) =>
        formatDuration(cache.duration, locale, duration, options),
      display: (code: string, options: FormatDisplayNameOptions) =>
        formatDisplayName(cache.display, locale, code, options),
      locale,
      messages,
    },
  )

  return translate
}
