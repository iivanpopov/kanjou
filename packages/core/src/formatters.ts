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
  MessageFunctions,
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

const JSON_NUMBER_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/
const BUILTIN_FUNCTION_NAMES: ReadonlySet<string> = new Set([
  'string',
  'number',
  'integer',
  'offset',
  'currency',
  'percent',
  'unit',
  'date',
  'time',
  'datetime',
])
const DATE_FIELDS_VALUES = new Set([
  'weekday',
  'day-weekday',
  'month-day',
  'month-day-weekday',
  'year-month-day',
  'year-month-day-weekday',
])
const DATE_LENGTH_VALUES = new Set(['long', 'medium', 'short'])
const TIME_PRECISION_VALUES = new Set(['hour', 'minute', 'second'])
const TIME_ZONE_STYLE_VALUES = new Set(['long', 'short'])

export function assertValidMessageFunctions(functions?: MessageFunctions): void {
  if (!functions) return
  for (const name of BUILTIN_FUNCTION_NAMES) {
    if (Object.hasOwn(functions, name) && functions[name] !== undefined) {
      throw new KanjouError(
        `Built-in function ":${name}" is AOT-compiled and cannot be overridden via options.functions.`,
      )
    }
  }
}

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
  return (
    Array.isArray(options) &&
    options.length === 2 &&
    typeof options[0] === 'object' &&
    options[0] !== null &&
    typeof options[1] === 'string' &&
    options[1] !== ''
  )
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
  if ('parts' in part && Array.isArray(part.parts) && part.parts.length > 0) {
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

function parseNumberOperand(value: unknown): number | bigint | null {
  const unwrapped = unwrapValue(value)
  if (typeof unwrapped === 'number') {
    return Number.isNaN(unwrapped) ? null : unwrapped
  }
  if (typeof unwrapped === 'bigint') return unwrapped
  if (typeof unwrapped === 'string') {
    const trimmed = unwrapped.trim()
    if (trimmed !== '' && JSON_NUMBER_RE.test(trimmed)) {
      const parsed = Number(trimmed)
      if (!Number.isNaN(parsed)) return parsed
    }
  }
  return null
}

function parseDateOperand(value: unknown): Date | number | null {
  const unwrapped = unwrapValue(value)
  if (unwrapped instanceof Date) {
    return Number.isNaN(unwrapped.getTime()) ? null : unwrapped
  }
  if (typeof unwrapped === 'number') {
    return Number.isFinite(unwrapped) ? unwrapped : null
  }
  if (typeof unwrapped === 'string' && unwrapped.trim() !== '') {
    const parsed = new Date(unwrapped)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function createMessageRuntime(
  cache: TranslateCache,
  locale: Locale,
  options?: MessageFormatOptions,
): MessageRuntime {
  assertValidMessageFunctions(options?.functions)

  const number: MessageRuntime['number'] = (value, opt, fallback) => {
    const num = parseNumberOperand(value)
    if (num === null) return fallback ?? '{:number}'
    return getIntlFormatter(cache.number, locale, opt, Intl.NumberFormat).format(num)
  }
  const date: MessageRuntime['date'] = (value, opt, fallback) => {
    const d = parseDateOperand(value)
    if (d === null) return fallback ?? '{:date}'
    return getIntlFormatter(cache.dateTime, locale, opt, Intl.DateTimeFormat).format(d)
  }
  const integer: MessageRuntime['integer'] = (value) => {
    const num = parseNumberOperand(value)
    if (num === null || typeof num === 'bigint') return num
    return Number.isFinite(num) ? Math.round(num) : num
  }
  const offset: MessageRuntime['offset'] = (value, delta, negate) => {
    const num = parseNumberOperand(value)
    if (num === null) return null
    const parsedDelta = parseNumberOperand(delta)
    if (parsedDelta === null) return null
    if (typeof parsedDelta === 'number' && !Number.isInteger(parsedDelta)) return null
    if (typeof num === 'bigint') {
      const d = typeof parsedDelta === 'bigint' ? parsedDelta : BigInt(parsedDelta)
      return negate ? num - d : num + d
    }
    const d = Number(parsedDelta)
    if (!Number.isFinite(d)) return null
    return negate ? num - d : num + d
  }
  const currencyOpts: MessageRuntime['currencyOpts'] = (base, fractionDigits) => {
    const out: FormatNumberOptions = { ...base }
    if (fractionDigits !== 'auto') {
      const n = parseNumberOperand(fractionDigits)
      if (typeof n === 'number' && Number.isInteger(n) && n >= 0) {
        out.minimumFractionDigits = n
        out.maximumFractionDigits = n
      }
    }
    return out
  }
  const dateOpts: MessageRuntime['dateOpts'] = (base, input) => {
    const out: FormatDateTimeOptions = base ? { ...base } : {}
    if (input.kind !== 'date' && input.hour12 !== undefined) {
      if (input.hour12 === true || input.hour12 === 'true') out.hour12 = true
      else if (input.hour12 === false || input.hour12 === 'false') out.hour12 = false
    }
    if (!input.hasDirectStyle) {
      if (input.kind !== 'time' && !input.hasDirectDateField) {
        const df =
          typeof input.fields === 'string' && DATE_FIELDS_VALUES.has(input.fields)
            ? input.fields
            : 'year-month-day'
        const dl =
          typeof input.length === 'string' && DATE_LENGTH_VALUES.has(input.length)
            ? input.length
            : undefined
        if (df.includes('year')) out.year = 'numeric'
        if (df.includes('month')) {
          if (dl === 'long') out.month = 'long'
          else if (dl === 'short') out.month = 'numeric'
          else out.month = 'short'
        }
        if (df === 'day-weekday' || df.includes('month-day')) out.day = 'numeric'
        if (df.includes('weekday')) out.weekday = dl === 'long' ? 'long' : 'short'
      }
      if (input.kind !== 'date' && !input.hasDirectTimeField) {
        const tp =
          typeof input.precision === 'string' && TIME_PRECISION_VALUES.has(input.precision)
            ? input.precision
            : 'minute'
        out.hour = 'numeric'
        if (tp !== 'hour') out.minute = 'numeric'
        if (tp === 'second') out.second = 'numeric'
      }
      if (input.kind !== 'date' && !input.hasDirectTimeZoneName) {
        if (
          typeof input.timeZoneStyle === 'string' &&
          TIME_ZONE_STYLE_VALUES.has(input.timeZoneStyle)
        ) {
          out.timeZoneName = input.timeZoneStyle as 'short' | 'long'
        }
      }
    }
    return out
  }
  const plural: MessageRuntime['plural'] = (value, opt) => {
    const num = parseNumberOperand(value)
    return formatPlural(cache.plural, locale, num === null ? Number.NaN : Number(num), opt)
  }

  const numberForSelection: MessageRuntime['numberForSelection'] = (value, options) => {
    const num = parseNumberOperand(value)
    if (num === null) return null
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
    if (keys.has(key)) return key
    const normalized = key.normalize()
    return normalized !== key && keys.has(normalized) ? normalized : null
  }

  const str: MessageRuntime['str'] = (value) => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'object') {
      const mv = value as MessageValue
      if (typeof mv.toString === 'function' && mv.toString !== Object.prototype.toString) {
        const result: unknown = mv.toString()
        return String(result)
      }
      if ('value' in mv && mv.value !== undefined) return coerceMessageResult(mv.value)
      if (typeof mv.toParts === 'function') return partsToString(mv.toParts())
      if (
        mv.type === 'fallback' &&
        'source' in mv &&
        typeof (mv as { source?: unknown }).source === 'string'
      ) {
        return `{${(mv as { source: string }).source}}`
      }
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

  return {
    locale,
    number,
    date,
    integer,
    offset,
    currencyOpts,
    dateOpts,
    plural,
    select,
    numberForSelection,
    selectPlural,
    fn,
    str,
    parts,
  }
}

const EMPTY_OPTIONS = Object.freeze({})

function getIntlFormatter<Formatter, Options extends object | undefined>(
  cache: Cache,
  locale: Locale,
  options: Options | CompiledIntlOptions<Options>,
  Formatter: new (locale: Locale, options: Options) => Formatter,
): Formatter {
  let intlOptions: Options
  let serialized: string | undefined
  if (isCompiledIntlOptions(options)) {
    intlOptions = options[0]
    serialized = options[1]
  } else if (Array.isArray(options)) {
    if (typeof options[0] === 'object' && options[0] !== null) {
      intlOptions = options[0] as Options
      serialized = serializeFlatOptions(options[0])
    } else {
      intlOptions = undefined as Options
      serialized = ''
    }
  } else {
    intlOptions = options
    serialized = intlOptions && serializeFlatOptions(intlOptions)
  }
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

const lazyRuntimeByGetter = new WeakMap<() => MessageRuntime, MessageRuntime>()

function getLazyRuntime(getRuntime: () => MessageRuntime): MessageRuntime {
  let lazy = lazyRuntimeByGetter.get(getRuntime)
  if (lazy) return lazy

  lazy = {
    get locale() {
      return getRuntime().locale
    },
    number: (value, opt, fallback) => getRuntime().number(value, opt, fallback),
    date: (value, opt, fallback) => getRuntime().date(value, opt, fallback),
    integer: (value) => getRuntime().integer(value),
    offset: (value, delta, negate) => getRuntime().offset(value, delta, negate),
    currencyOpts: (base, fractionDigits) => getRuntime().currencyOpts(base, fractionDigits),
    dateOpts: (base, input) => getRuntime().dateOpts(base, input),
    plural: (value, opt) => getRuntime().plural(value, opt),
    select: (value, keys, opt) => getRuntime().select(value, keys, opt),
    numberForSelection: (value, options) => getRuntime().numberForSelection(value, options),
    selectPlural: (num, options) => getRuntime().selectPlural(num, options),
    fn: (name, operand, exprOpt, literalOptionKeys) =>
      getRuntime().fn(name, operand, exprOpt, literalOptionKeys),
    str: (value) => getRuntime().str(value),
    parts: (value) => getRuntime().parts(value),
  }
  lazyRuntimeByGetter.set(getRuntime, lazy)
  return lazy
}

function callRenderer<Result>(
  render: (values?: Record<string, any>, runtime?: MessageRuntime) => Result,
  values: Record<string, any> | undefined,
  getRuntime: () => MessageRuntime,
): Result {
  return render.length < 2
    ? render(values, getLazyRuntime(getRuntime))
    : render(values, getRuntime())
}

export function formatMessage<Id extends string = MessageId>(
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values: MessageValues<Id> | undefined,
  getRuntime: () => MessageRuntime,
): string {
  const message = resolveMessage(messages, id)
  if (typeof message === 'string') return message
  if (typeof message !== 'function' && (message === null || typeof message !== 'object')) return id

  try {
    if (typeof message === 'function') return callRenderer(message, values, getRuntime)
    if ('render' in message && typeof message.render === 'function') {
      return message.render(values, getRuntime(), false)
    }
    if ('parts' in message && typeof message.parts === 'function') {
      return partsToString(callRenderer(message.parts, values, getRuntime))
    }
    return id
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
  if (typeof message === 'string') return toTextParts(message)
  if (typeof message !== 'function' && (message === null || typeof message !== 'object')) return []

  try {
    if (typeof message === 'function') return toTextParts(callRenderer(message, values, getRuntime))
    if ('render' in message && typeof message.render === 'function') {
      return message.render(values, getRuntime(), true)
    }
    if ('parts' in message && typeof message.parts === 'function') {
      return callRenderer(message.parts, values, getRuntime)
    }
    return []
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
  if (typeof Intl.DurationFormat !== 'function') {
    throw new KanjouError(
      'Intl.DurationFormat is not supported in this runtime. Upgrade to Node >= 23 or a supported browser, or load an Intl.DurationFormat polyfill.',
    )
  }
  return getIntlFormatter(cache, locale, options, Intl.DurationFormat).format(duration)
}
