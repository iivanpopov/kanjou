import type { MessageFormatOptions as MfOptions, MessagePart, Model } from 'messageformat'
import type { MessageFunction as MfMessageFunction } from 'messageformat/functions'

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
  MessageFunctions,
  MessageId,
  MessageValues,
  NumberLike,
  PluralRule,
  Unit,
} from './types'

import { KanjouFormatError } from './errors'

interface MessageCacheEntry {
  byKey: Map<string, MessageFormat>
  byFunctions?: WeakMap<object, Map<string, MessageFormat>>
}

export interface FormatMessageParams<Id extends string = MessageId> {
  cache: Cache<object>
  locale: Locale
  messages: Readonly<Record<string, Message>>
  id: Id
  values?: MessageValues<Id> | undefined
  options?: MessageFormatOptions | undefined
}

export interface FormatMessagePartsParams<Id extends string = MessageId> {
  cache: Cache<object>
  locale: Locale
  messages: Readonly<Record<string, Message>>
  id: Id
  values?: MessageValues<Id> | undefined
  options?: MessageFormatOptions | undefined
}

export interface FormatRelativeTimeParams {
  cache: Cache
  locale: Locale
  value: number
  unit: Unit
  options?: FormatRelativeTimeOptions | undefined
}

function serializeCanonical(value: unknown, seen?: WeakSet<object>): string {
  if (value === null) return 'null'

  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'bigint') return `${String(value)}n`
  if (typeof value === 'undefined' || typeof value === 'function' || typeof value === 'symbol') {
    return ''
  }

  if (typeof value !== 'object') return ''

  const obj = value
  const visited = seen ?? new WeakSet<object>()
  if (visited.has(obj)) return '"[Circular]"'

  visited.add(obj)
  try {
    if ('toJSON' in obj && typeof (obj as { toJSON?: unknown }).toJSON === 'function') {
      const json = (obj as { toJSON: () => unknown }).toJSON()
      if (json !== obj) {
        return serializeCanonical(json, visited)
      }
    }

    if (Array.isArray(obj)) {
      const parts: string[] = ['[']
      for (let i = 0; i < obj.length; i++) {
        if (i > 0) parts.push(',')
        const item = serializeCanonical(obj[i], visited)
        parts.push(item === '' ? 'null' : item)
      }
      parts.push(']')
      return parts.join('')
    }

    const record = obj as Record<string, unknown>
    const keys = Object.keys(record).sort()
    const parts: string[] = ['{']
    let first = true
    for (const key of keys) {
      const serialized = serializeCanonical(record[key], visited)
      if (serialized === '') continue
      if (!first) parts.push(',')
      first = false
      parts.push(JSON.stringify(key), ':', serialized)
    }
    parts.push('}')
    return parts.join('')
  } finally {
    visited.delete(obj)
  }
}

function getKey(locale: string, options?: unknown): string {
  if (!options || typeof options !== 'object') return locale
  const serialized = serializeCanonical(options)
  return serialized && serialized !== '{}' ? `${locale.length}:${locale}:${serialized}` : locale
}

function getMessageOptionsKey(locale: string, options?: MessageFormatOptions): string {
  if (!options) return locale
  const { dir = '', localeMatcher = '', bidiIsolation = '' } = options
  if (!dir && !localeMatcher && !bidiIsolation) return locale
  return JSON.stringify([locale, dir, localeMatcher, bidiIsolation])
}

function resolveFunctions(
  functions: MessageFunctions,
): Record<string, MfMessageFunction<string, string>> {
  let hasUndefined = false
  for (const key of Object.keys(functions)) {
    if (functions[key] === undefined) {
      hasUndefined = true
      break
    }
  }
  const source = hasUndefined
    ? Object.fromEntries(
        Object.entries(functions).filter(
          (entry): entry is [string, NonNullable<(typeof entry)[1]>] => entry[1] !== undefined,
        ),
      )
    : functions
  return source as Record<string, MfMessageFunction<string, string>>
}

function toMessageFormatOptions(
  options?: MessageFormatOptions,
): MfOptions<string, string> | undefined {
  if (!options) return undefined
  const mfOptions: MfOptions<string, string> = {}
  if (options.bidiIsolation !== undefined) mfOptions.bidiIsolation = options.bidiIsolation
  if (options.dir !== undefined) mfOptions.dir = options.dir
  if (options.localeMatcher !== undefined) mfOptions.localeMatcher = options.localeMatcher
  if (options.functions !== undefined) mfOptions.functions = resolveFunctions(options.functions)
  return mfOptions
}

function getMessageFormatter(
  cache: Cache<object, MessageCacheEntry>,
  locale: Locale,
  message: Model.Message,
  options?: MessageFormatOptions,
): MessageFormat<string, string> {
  let entry = cache.get(message)
  if (!entry) {
    entry = { byKey: new Map() }
    cache.set(message, entry)
  }

  let byKey: Map<string, MessageFormat<string, string>>
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
    formatter = new MessageFormat<string, string>(locale, message, toMessageFormatOptions(options))
    byKey.set(optKey, formatter)
  }
  return formatter
}

export function resolveMessage(
  messages: Readonly<Record<string, Message>>,
  id: string,
): Message | undefined {
  return Object.hasOwn(messages, id) ? messages[id] : undefined
}

function toTextParts<Id extends string>(
  text: string,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[] {
  return text === '' ? [] : [{ type: 'text', value: text }]
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
  try {
    return JSON.stringify(result) ?? ''
  } catch {
    // oxlint-disable-next-line typescript/no-base-to-string
    return String(result)
  }
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

function isFormatMessageParams<Id extends string>(
  arg: Cache<object> | FormatMessageParams<Id>,
): arg is FormatMessageParams<Id> {
  return 'messages' in arg && 'id' in arg && 'cache' in arg
}

function isFormatRelativeTimeParams(
  arg: Cache | FormatRelativeTimeParams,
): arg is FormatRelativeTimeParams {
  return 'value' in arg && 'unit' in arg && 'cache' in arg
}

export function formatMessage<Id extends string = MessageId>(
  params: FormatMessageParams<Id>,
): string
export function formatMessage<Id extends string = MessageId>(
  cache: Cache<object>,
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): string
export function formatMessage<Id extends string = MessageId>(
  cacheOrParams: Cache<object> | FormatMessageParams<Id>,
  localeArg?: Locale,
  messagesArg?: Readonly<Record<string, Message>>,
  idArg?: Id,
  valuesArg?: MessageValues<Id>,
  optionsArg?: MessageFormatOptions,
): string {
  const params = isFormatMessageParams(cacheOrParams)
    ? cacheOrParams
    : {
        cache: cacheOrParams,
        locale: localeArg!,
        messages: messagesArg!,
        id: idArg!,
        values: valuesArg,
        options: optionsArg,
      }
  const { cache, locale, messages, id, values, options } = params

  const message = resolveMessage(messages, id)
  if (message === undefined) return id
  if (typeof message === 'string') return message
  if (typeof message === 'function') return coerceMessageResult(message(values))
  if (!message || typeof message !== 'object') return id

  try {
    return getMessageFormatter(cache, locale, message, options).format(values)
  } catch (err) {
    throw new KanjouFormatError(
      `Failed to format message "${id}" for locale "${locale}"`,
      { locale, messageId: id },
      { cause: err },
    )
  }
}

export function formatMessageParts<Id extends string = MessageId>(
  params: FormatMessagePartsParams<Id>,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[]
export function formatMessageParts<Id extends string = MessageId>(
  cache: Cache<object>,
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values?: MessageValues<Id>,
  options?: MessageFormatOptions,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[]
export function formatMessageParts<Id extends string = MessageId>(
  cacheOrParams: Cache<object> | FormatMessagePartsParams<Id>,
  localeArg?: Locale,
  messagesArg?: Readonly<Record<string, Message>>,
  idArg?: Id,
  valuesArg?: MessageValues<Id>,
  optionsArg?: MessageFormatOptions,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[] {
  const params = isFormatMessageParams(cacheOrParams)
    ? cacheOrParams
    : {
        cache: cacheOrParams,
        locale: localeArg!,
        messages: messagesArg!,
        id: idArg!,
        values: valuesArg,
        options: optionsArg,
      }
  const { cache, locale, messages, id, values, options } = params

  const message = resolveMessage(messages, id)
  if (message === undefined) return []
  if (typeof message === 'string') return toTextParts<Id>(message)
  if (typeof message === 'function') return toTextParts<Id>(coerceMessageResult(message(values)))
  if (!message || typeof message !== 'object') return []

  try {
    return getMessageFormatter(cache, locale, message, options).formatToParts(
      values,
    ) as MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[]
  } catch (err) {
    throw new KanjouFormatError(
      `Failed to format message parts "${id}" for locale "${locale}"`,
      { locale, messageId: id },
      { cause: err },
    )
  }
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

export function formatRelativeTime(params: FormatRelativeTimeParams): string
export function formatRelativeTime(
  cache: Cache,
  locale: Locale,
  value: number,
  unit: Unit,
  options?: FormatRelativeTimeOptions,
): string
export function formatRelativeTime(
  cacheOrParams: Cache | FormatRelativeTimeParams,
  localeArg?: Locale,
  valueArg?: number,
  unitArg?: Unit,
  optionsArg?: FormatRelativeTimeOptions,
): string {
  const params = isFormatRelativeTimeParams(cacheOrParams)
    ? cacheOrParams
    : {
        cache: cacheOrParams,
        locale: localeArg!,
        value: valueArg!,
        unit: unitArg!,
        options: optionsArg,
      }
  const { cache, locale, value, unit, options } = params

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
