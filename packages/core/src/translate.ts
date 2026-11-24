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
import { getIntlFormatter } from './formatters'
import { formatMessage, formatMessageParts } from './runtime'

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
  cache = getSharedTranslateCache(),
  options,
}: CreateTranslateOptions): Translate {
  const context = { locale, cache, functions: options?.functions }

  const parts: TranslateParts = Object.assign(
    <Id extends MessageId>(id: Id, values?: MessageValues<Id>) =>
      formatMessageParts(locale, messages, id, values, context),
    {
      unsafe: (id?: string, values?: Record<string, any>) =>
        formatMessageParts(locale, messages, id ?? '', values, context),
    },
  )

  const translate: Translate = Object.assign(
    <Id extends MessageId>(id: Id, values?: MessageValues<Id>) =>
      formatMessage(locale, messages, id, values, context),
    {
      unsafe: (id?: string, values?: Record<string, any>) =>
        formatMessage(locale, messages, id ?? '', values, context),
      parts,
      number: (number: NumberLike, options?: FormatNumberOptions) =>
        getIntlFormatter(cache.number, locale, options, Intl.NumberFormat).format(number),
      date: (date: DateLike, options?: FormatDateTimeOptions) =>
        getIntlFormatter(cache.dateTime, locale, options, Intl.DateTimeFormat).format(date),
      plural: (number: number, options?: FormatPluralOptions) =>
        getIntlFormatter(cache.plural, locale, options, Intl.PluralRules).select(number),
      list: (list: ListLike, options?: FormatListOptions) =>
        getIntlFormatter(cache.list, locale, options, Intl.ListFormat).format(list),
      relative: (value: number, unit: Unit, options?: FormatRelativeTimeOptions) =>
        getIntlFormatter(cache.relative, locale, options, Intl.RelativeTimeFormat).format(
          value,
          unit,
        ),
      duration: (duration: Duration, options?: FormatDurationOptions) =>
        getIntlFormatter(cache.duration, locale, options, Intl.DurationFormat).format(duration),
      display: (code: string, options: FormatDisplayNameOptions) =>
        getIntlFormatter(cache.display, locale, options, Intl.DisplayNames).of(code),
      locale,
      messages,
    },
  )

  return translate
}
