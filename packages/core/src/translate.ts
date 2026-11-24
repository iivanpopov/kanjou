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
  InferPartsType,
  ListLike,
  Locale,
  Message,
  MessageFormatOptions,
  MessageId,
  MessagePart,
  MessageValues,
  NumberLike,
  PluralRule,
  Unit,
} from './types'

import { getSharedTranslateCache } from './cache'
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
  messages: Readonly<Record<string, Message>>
  cache?: TranslateCache | undefined
  options?: MessageFormatOptions | undefined
}

export interface TranslateParts {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): MessagePart<InferPartsType<Id>>[]
  unsafe: (id?: string, values?: Record<string, any>) => MessagePart<any>[]
}

export interface Translate {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): string
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
  messages: Readonly<Record<string, Message>>
}

export function createTranslate({
  locale,
  messages,
  cache,
  options,
}: CreateTranslateOptions): Translate {
  const resolvedCache = cache ?? getSharedTranslateCache()

  const parts: TranslateParts = Object.assign(
    <Id extends MessageId>(id: Id, values?: MessageValues<Id>) =>
      formatMessageParts({ cache: resolvedCache.message, locale, messages, id, values, options }),
    {
      unsafe: (id?: string, values?: Record<string, any>) =>
        formatMessageParts({
          cache: resolvedCache.message,
          locale,
          messages,
          id: id ?? '',
          values,
          options,
        }),
    },
  )

  const translate: Translate = Object.assign(
    <Id extends MessageId>(id: Id, values?: MessageValues<Id>) =>
      formatMessage({ cache: resolvedCache.message, locale, messages, id, values, options }),
    {
      unsafe: (id?: string, values?: Record<string, any>) =>
        formatMessage({
          cache: resolvedCache.message,
          locale,
          messages,
          id: id ?? '',
          values,
          options,
        }),
      parts,
      number: (number: NumberLike, options?: FormatNumberOptions) =>
        formatNumber(resolvedCache.number, locale, number, options),
      date: (date: DateLike, options?: FormatDateTimeOptions) =>
        formatDateTime(resolvedCache.dateTime, locale, date, options),
      plural: (number: number, options?: FormatPluralOptions) =>
        formatPlural(resolvedCache.plural, locale, number, options),
      list: (list: ListLike, options?: FormatListOptions) =>
        formatList(resolvedCache.list, locale, list, options),
      relative: (value: number, unit: Unit, options?: FormatRelativeTimeOptions) =>
        formatRelativeTime({ cache: resolvedCache.relative, locale, value, unit, options }),
      duration: (duration: Duration, options?: FormatDurationOptions) =>
        formatDuration(resolvedCache.duration, locale, duration, options),
      display: (code: string, options: FormatDisplayNameOptions) =>
        formatDisplayName(resolvedCache.display, locale, code, options),
      locale,
      messages,
    },
  )

  return translate
}
