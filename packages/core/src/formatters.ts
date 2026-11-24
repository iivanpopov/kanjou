import type { Cache, TranslateCache } from './cache'
import type {
  CompiledIntlOptions,
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
  MessageFunctionContext,
  MessageId,
  MessagePart,
  MessageRuntime,
  MessageValue,
  MessageValues,
  NumberLike,
  PluralRule,
  Unit,
} from './types'

import { KanjouError, KanjouFormatError } from './errors'

export interface FormatRelativeTimeParams {
  cache: Cache
  locale: Locale
  value: number
  unit: Unit
  options?: FormatRelativeTimeOptions | undefined
}

function serializeFlatOptions(options: object): string {
  const keys = Object.keys(options).sort()
  if (keys.length === 0) return ''

  const json = JSON.stringify(options, keys)
  return json === '{}' ? '' : json
}

function isCompiledIntlOptions<Options>(
  options: Options | CompiledIntlOptions<Options> | undefined,
): options is CompiledIntlOptions<Options> {
  return Array.isArray(options)
}

export function resolveMessage(
  messages: Readonly<Record<string, Message>>,
  id: string,
): Message | undefined {
  return Object.hasOwn(messages, id) ? messages[id] : undefined
}

function toTextParts(text: string): MessagePart[] {
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

function partToText(part: MessagePart): string {
  if (part.type === 'markup') return ''
  if ('parts' in part && Array.isArray(part.parts)) {
    let text = ''
    for (const sub of part.parts) {
      if (sub.value !== null && sub.value !== undefined) {
        text += String(sub.value)
      }
    }
    return text
  }
  if ('value' in part && part.value !== null && part.value !== undefined) {
    return coerceMessageResult(part.value)
  }
  if (part.type === 'fallback' && 'source' in part) return `{${part.source}}`
  return ''
}

function partsToString(parts: readonly MessagePart[]): string {
  let result = ''
  for (const part of parts) result += partToText(part)
  return result
}

function unwrapValue(value: unknown): unknown {
  if (typeof value === 'object' && value !== null && typeof value.valueOf === 'function') {
    return value.valueOf()
  }
  return value
}

function toNumber(value: unknown): number | bigint {
  const unwrapped = unwrapValue(value)
  if (typeof unwrapped === 'number' || typeof unwrapped === 'bigint') return unwrapped
  if (typeof unwrapped === 'string' && unwrapped.trim() !== '') {
    const parsed = Number(unwrapped)
    if (!Number.isNaN(parsed)) return parsed
  }
  return Number.NaN
}

function toDate(value: unknown): Date | number {
  const unwrapped = unwrapValue(value)
  if (unwrapped instanceof Date || typeof unwrapped === 'number') return unwrapped
  if (typeof unwrapped === 'string') return new Date(unwrapped)
  return new Date(Number.NaN)
}

export function createMessageRuntime(
  cache: TranslateCache,
  locale: Locale,
  options?: MessageFormatOptions,
): MessageRuntime {
  const number: MessageRuntime['number'] = (value, opt) =>
    getIntlFormatter(cache.number, locale, opt, Intl.NumberFormat).format(toNumber(value))
  const date: MessageRuntime['date'] = (value, opt) =>
    getIntlFormatter(cache.dateTime, locale, opt, Intl.DateTimeFormat).format(toDate(value))
  const plural: MessageRuntime['plural'] = (value, opt) =>
    formatPlural(cache.plural, locale, Number(toNumber(value)), opt)

  const numberForSelection: MessageRuntime['numberForSelection'] = (value, options) => {
    const num = toNumber(value)
    if (Number.isNaN(num)) return null
    const opt = isCompiledIntlOptions(options) ? options[0] : options
    if (opt?.style === 'percent') {
      return typeof num === 'bigint' ? num * 100n : num * 100
    }
    return num
  }

  const selectPlural: MessageRuntime['selectPlural'] = (num, options) => {
    const opt = isCompiledIntlOptions(options) ? options[0] : options
    if (num === null || opt?.select === 'exact') return null
    return getIntlFormatter(cache.plural, locale, options, Intl.PluralRules).select(Number(num))
  }

  const select: MessageRuntime['select'] = (value, keys, opt) => {
    if (typeof value === 'object' && value !== null) {
      const result = value as MessageValue
      if (typeof result.selectKey === 'function') {
        const key = result.selectKey(new Set(keys))
        return key !== null && keys.has(key) ? key : null
      }
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
      const num = numberForSelection(value, opt)
      if (num === null) return null
      const exact = String(num)
      if (keys.has(exact)) return exact
      const category = selectPlural(num, opt)
      return category !== null && keys.has(category) ? category : null
    }

    const key = value === null || value === undefined ? '' : coerceMessageResult(value)
    return keys.has(key) ? key : null
  }

  const str: MessageRuntime['str'] = (value) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      const mv = value as MessageValue
      if (typeof mv.toString === 'function' && mv.toString !== Object.prototype.toString) {
        return mv.toString()
      }
      if ('value' in mv) return coerceMessageResult(mv.value)
    }
    return coerceMessageResult(value)
  }

  let defaultContext: MessageFunctionContext | undefined
  let contextsByKeys: WeakMap<readonly string[], MessageFunctionContext> | undefined

  const fn: MessageRuntime['fn'] = (name, operand, exprOpt, literalOptionKeys) => {
    const functions = options?.functions
    const func = functions && Object.hasOwn(functions, name) ? functions[name] : undefined
    if (!func) {
      throw new KanjouError(`Unknown message function ":${name}"`)
    }
    let context = (defaultContext ??= {
      locale,
      number,
      date,
      plural,
      select,
      literalOptionKeys: new Set<string>(),
    })
    if (literalOptionKeys?.length) {
      const contexts = (contextsByKeys ??= new WeakMap())
      const previous = contexts.get(literalOptionKeys)
      if (previous) {
        context = previous
      } else {
        context = { ...defaultContext, literalOptionKeys: new Set(literalOptionKeys) }
        contexts.set(literalOptionKeys, context)
      }
    }
    return func(context, exprOpt ?? EMPTY_OPTIONS, operand)
  }

  const parts: MessageRuntime['parts'] = (value) => {
    if (value === null || value === undefined) return []
    if (typeof value === 'object' && typeof (value as MessageValue).toParts === 'function') {
      return (value as MessageValue).toParts!()
    }
    const text = str(value)
    return text === '' ? [] : [{ type: 'text', value: text }]
  }

  return { locale, number, date, plural, select, numberForSelection, selectPlural, fn, str, parts }
}

const EMPTY_OPTIONS = Object.freeze({})

function getIntlFormatter<Formatter, Options extends object | undefined>(
  cache: Cache,
  locale: Locale,
  options: Options | CompiledIntlOptions<Options>,
  Formatter: new (locale: Locale, options: Options) => Formatter,
): Formatter {
  const compiled = isCompiledIntlOptions(options)
  const intlOptions = compiled ? options[0] : options
  const serialized = compiled ? options[1] : intlOptions && serializeFlatOptions(intlOptions)
  const key = serialized ? `${locale.length}:${locale}:${serialized}` : locale
  let formatter: Formatter | undefined = cache.get(key)
  if (!formatter) {
    formatter = new Formatter(locale, intlOptions)
    cache.set(key, formatter)
  }
  return formatter
}

function isFormatRelativeTimeParams(
  arg: Cache | FormatRelativeTimeParams,
): arg is FormatRelativeTimeParams {
  return 'value' in arg && 'unit' in arg && 'cache' in arg
}

function callRenderer<Result>(
  render: (values?: Record<string, any>, runtime?: MessageRuntime) => Result,
  values: Record<string, any> | undefined,
  getRuntime: () => MessageRuntime,
): Result {
  return render.length < 2 ? render(values) : render(values, getRuntime())
}

export function formatMessage<Id extends string = MessageId>(
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values: MessageValues<Id> | undefined,
  getRuntime: () => MessageRuntime,
): string {
  const message = resolveMessage(messages, id)
  if (message === undefined) return id
  if (typeof message === 'string') return message

  try {
    if (typeof message === 'function') return callRenderer(message, values, getRuntime)
    if ('render' in message) return message.render(values, getRuntime(), false)
    return partsToString(callRenderer(message.parts, values, getRuntime))
  } catch (err) {
    throw new KanjouFormatError(
      `Failed to format message "${id}" for locale "${locale}"`,
      { locale, messageId: id },
      { cause: err },
    )
  }
}

export function formatMessageParts<Id extends string = MessageId>(
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values: MessageValues<Id> | undefined,
  getRuntime: () => MessageRuntime,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[]
export function formatMessageParts<Id extends string>(
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values: MessageValues<Id> | undefined,
  getRuntime: () => MessageRuntime,
): MessagePart[] {
  const message = resolveMessage(messages, id)
  if (message === undefined) return []
  if (typeof message === 'string') return toTextParts(message)

  try {
    if (typeof message === 'function') return toTextParts(callRenderer(message, values, getRuntime))
    if ('render' in message) return message.render(values, getRuntime(), true)
    return callRenderer(message.parts, values, getRuntime)
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
  return getIntlFormatter(cache, locale, options, Intl.DateTimeFormat).format(date)
}

export function formatNumber(
  cache: Cache,
  locale: Locale,
  number: NumberLike,
  options?: FormatNumberOptions,
): string {
  return getIntlFormatter(cache, locale, options, Intl.NumberFormat).format(number)
}

export function formatPlural(
  cache: Cache,
  locale: Locale,
  number: number,
  options?: FormatPluralOptions,
): PluralRule {
  return getIntlFormatter(cache, locale, options, Intl.PluralRules).select(number)
}

export function formatList(
  cache: Cache,
  locale: Locale,
  list: ListLike,
  options?: FormatListOptions,
): string {
  return getIntlFormatter(cache, locale, options, Intl.ListFormat).format(list)
}

export function formatDisplayName(
  cache: Cache,
  locale: Locale,
  code: string,
  options: FormatDisplayNameOptions,
): string | undefined {
  return getIntlFormatter(cache, locale, options, Intl.DisplayNames).of(code)
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

  return getIntlFormatter(cache, locale, options, Intl.RelativeTimeFormat).format(value, unit)
}

export function formatDuration(
  cache: Cache,
  locale: Locale,
  duration: Duration,
  options?: FormatDurationOptions,
): string {
  return getIntlFormatter(cache, locale, options, Intl.DurationFormat).format(duration)
}
