import type { MessagePart, Model } from 'messageformat'

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

interface MessageCacheEntry {
  byKey: Map<string, MessageFormat>
  byFunctions?: WeakMap<object, Map<string, MessageFormat>>
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return typeof value === 'function' || typeof value === 'symbol' ? undefined : value
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize)
  }
  if (typeof (value as { toJSON?: unknown }).toJSON === 'function') {
    return canonicalize((value as { toJSON: () => unknown }).toJSON())
  }
  const record = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(record).sort()) {
    const canonical = canonicalize(record[key])
    if (canonical !== undefined) {
      Object.defineProperty(result, key, {
        value: canonical,
        enumerable: true,
        configurable: true,
        writable: true,
      })
    }
  }
  return result
}

function stableStringify(value: unknown): string | undefined {
  return JSON.stringify(canonicalize(value))
}

function getKey(locale: string, options?: unknown): string {
  if (!options || typeof options !== 'object') return locale
  const serialized = stableStringify(options)
  return serialized && serialized !== '{}' ? `${locale}\0${serialized}` : locale
}

function getMessageOptionsKey(locale: string, options?: MessageFormatOptions): string {
  if (!options) return locale
  const { dir = '', localeMatcher = '', bidiIsolation = '' } = options
  if (!dir && !localeMatcher && !bidiIsolation) return locale
  return `${locale}\0${dir}|${localeMatcher}|${bidiIsolation}`
}

function getMessageFormatter(
  cache: Cache<object, MessageCacheEntry>,
  locale: Locale,
  message: Model.Message,
  options?: MessageFormatOptions,
): MessageFormat {
  let entry = cache.get(message)
  if (!entry) {
    entry = { byKey: new Map() }
    cache.set(message, entry)
  }

  let byKey: Map<string, MessageFormat>
  if (options?.functions) {
    entry.byFunctions ??= new WeakMap()
    let fnMap = entry.byFunctions.get(options.functions)
    if (!fnMap) {
      fnMap = new Map()
      entry.byFunctions.set(options.functions, fnMap)
    }
    byKey = fnMap
  } else {
    byKey = entry.byKey
  }

  const optKey = getMessageOptionsKey(locale, options)
  let formatter = byKey.get(optKey)
  if (!formatter) {
    formatter = new MessageFormat(locale, message, options as any)
    byKey.set(optKey, formatter)
  }
  return formatter
}

function toTextParts<Id extends string>(
  text: string,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[] {
  return text === '' ? [] : ([{ type: 'text', value: text }] as any)
}

function coerceMessageResult(result: unknown): string {
  if (result === null || result === undefined) return ''
  if (typeof result === 'string') return result
  if (
    typeof result === 'number' ||
    typeof result === 'boolean' ||
    typeof result === 'bigint' ||
    typeof result === 'symbol'
  ) {
    return String(result)
  }
  return JSON.stringify(result) ?? ''
}

function getIntlFormatter<Formatter, Options>(
  cache: Cache,
  locale: Locale,
  options: Options,
  create: (locale: Locale, options: Options) => Formatter,
): Formatter {
  const key = getKey(locale, options)
  let formatter: Formatter | undefined = cache.get(key)
  if (!formatter) {
    formatter = create(locale, options)
    cache.set(key, formatter)
  }
  return formatter
}

export function formatMessage<Id extends string = MessageId>(
  cache: Cache<object>,
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): string {
  const message = messages[id]
  if (message === undefined) return id
  if (typeof message === 'string') return message
  if (typeof message === 'function') return coerceMessageResult(message(values))
  if (!message || typeof message !== 'object') return id

  return getMessageFormatter(cache, locale, message, options).format(values)
}

export function formatMessageParts<Id extends string = MessageId>(
  cache: Cache<object>,
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[] {
  const message = messages[id]
  if (message === undefined) return []
  if (typeof message === 'string') return toTextParts<Id>(message)
  if (typeof message === 'function') return toTextParts<Id>(coerceMessageResult(message(values)))
  if (!message || typeof message !== 'object') return []

  return getMessageFormatter(cache, locale, message, options).formatToParts(values)
}

export function formatDateTime(
  cache: Cache,
  locale: Locale,
  date: DateLike,
  options?: FormatDateTimeOptions,
): string {
  return getIntlFormatter(cache, locale, options, (l, o) => new Intl.DateTimeFormat(l, o)).format(
    date,
  )
}

export function formatNumber(
  cache: Cache,
  locale: Locale,
  number: NumberLike,
  options?: FormatNumberOptions,
): string {
  return getIntlFormatter(cache, locale, options, (l, o) => new Intl.NumberFormat(l, o)).format(
    number,
  )
}

export function formatPlural(
  cache: Cache,
  locale: Locale,
  number: number,
  options?: FormatPluralOptions,
): PluralRule {
  return getIntlFormatter(cache, locale, options, (l, o) => new Intl.PluralRules(l, o)).select(
    number,
  )
}

export function formatList(
  cache: Cache,
  locale: Locale,
  list: ListLike,
  options?: FormatListOptions,
): string {
  return getIntlFormatter(cache, locale, options, (l, o) => new Intl.ListFormat(l, o)).format(list)
}

export function formatDisplayName(
  cache: Cache,
  locale: Locale,
  code: string,
  options: FormatDisplayNameOptions,
): string | undefined {
  return getIntlFormatter(cache, locale, options, (l, o) => new Intl.DisplayNames(l, o)).of(code)
}

export function formatRelativeTime(
  cache: Cache,
  locale: Locale,
  value: number,
  unit: Unit,
  options?: FormatRelativeTimeOptions,
): string {
  return getIntlFormatter(
    cache,
    locale,
    options,
    (l, o) => new Intl.RelativeTimeFormat(l, o),
  ).format(value, unit)
}

export function formatDuration(
  cache: Cache,
  locale: Locale,
  duration: Duration,
  options?: FormatDurationOptions,
): string {
  return getIntlFormatter(cache, locale, options, (l, o) => new Intl.DurationFormat(l, o)).format(
    duration,
  )
}
