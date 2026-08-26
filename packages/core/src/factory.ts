import type { KanjouCache } from './cache'
import type {
  Functions,
  InferPartsType,
  Locale,
  Message,
  MessageFormatOptions,
  MessageId,
  MessagePart,
  MessageValues,
} from './types'

import { createCache } from './cache'
import { createFormatters } from './formatters'
import { formatDate } from './formatters/format-date'
import { formatDisplayName } from './formatters/format-display-name'
import { formatDuration } from './formatters/format-duration'
import { formatList } from './formatters/format-list'
import { formatMessage, formatMessageParts } from './formatters/format-message'
import { formatNumber } from './formatters/format-number'
import { formatPlural } from './formatters/format-plural'
import { formatRelativeTime } from './formatters/format-relative-time'
import { formatTime } from './formatters/format-time'

export interface Kanjou {
  locale: Locale
  t: <Id extends MessageId>(id: Id, values?: MessageValues<Id>) => string
  formatMessage: <Id extends MessageId>(id: Id, values?: MessageValues<Id>) => string
  formatMessageParts: <Id extends MessageId>(
    id: Id,
    values?: MessageValues<Id>,
  ) => MessagePart<InferPartsType<Id>>[]
  formatDate: (value: number | Date, options?: Intl.DateTimeFormatOptions) => string
  formatTime: (value: number | Date, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (value: number | bigint, options?: Intl.NumberFormatOptions) => string
  formatPlural: (value: number, options?: Intl.PluralRulesOptions) => Intl.LDMLPluralRule
  formatList: (value: Iterable<string>, options?: Intl.ListFormatOptions) => string
  formatDisplayName: (value: string, options: Intl.DisplayNamesOptions) => string | undefined
  formatRelativeTime: (
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    options?: Intl.RelativeTimeFormatOptions,
  ) => string
  formatDuration: (
    value: Parameters<Intl.DurationFormat['format']>[0],
    options?: Intl.DurationFormatOptions,
  ) => string
}

export interface KanjouOptions {
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: Functions
  cache?: KanjouCache
}

export interface CreateKanjouOptions extends KanjouOptions {
  locale: Locale
  messages: Record<string, Message>
}

export function createKanjou({
  locale,
  messages,
  options,
  functions,
  cache = createCache(),
}: CreateKanjouOptions): Kanjou {
  const _options = { ...options, functions }
  const formatters = createFormatters(cache)

  const _formatMessage = <Id extends MessageId>(id: Id, values?: MessageValues<Id>) =>
    formatMessage(formatters.getMessageFormat, messages, locale, id, values, _options)
  const _formatMessageParts = <Id extends MessageId>(id: Id, values?: MessageValues<Id>) =>
    formatMessageParts(formatters.getMessageFormat, messages, locale, id, values, _options)

  return {
    locale,
    t: _formatMessage,
    formatMessage: _formatMessage,
    formatMessageParts: _formatMessageParts,
    formatDate: (value, opt) => formatDate(formatters.getDateTimeFormat, locale, value, opt),
    formatTime: (value, opt) => formatTime(formatters.getDateTimeFormat, locale, value, opt),
    formatNumber: (value, opt) => formatNumber(formatters.getNumberFormat, locale, value, opt),
    formatPlural: (value, opt) => formatPlural(formatters.getPluralRules, locale, value, opt),
    formatList: (value, opt) => formatList(formatters.getListFormat, locale, value, opt),
    formatDisplayName: (value, opt) =>
      formatDisplayName(formatters.getDisplayNames, locale, value, opt),
    formatRelativeTime: (value, unit, opt) =>
      formatRelativeTime(formatters.getRelativeTimeFormat, locale, value, unit, opt),
    formatDuration: (value, opt) =>
      formatDuration(formatters.getDurationFormat, locale, value, opt),
  }
}

export interface CreateKanjouFactoryOptions extends KanjouOptions {
  resources: Record<string, Record<string, Message>>
}

export type KanjouFactory<Instance extends Kanjou = Kanjou> = (locale: Locale) => Instance

export function createKanjouFactory({
  resources,
  options,
  functions,
  cache = createCache(),
}: CreateKanjouFactoryOptions): KanjouFactory {
  return (locale) =>
    cache.instances.getOrInsertComputed(locale, () => {
      const messages = resources[locale]
      return createKanjou({ locale, messages, options, functions, cache })
    })
}
