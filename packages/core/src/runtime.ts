import type {
  CompiledIntlOptions,
  DynamicDateTimeOptionsInput,
  FormatDateTimeOptions,
  FormatNumberOptions,
  FormatPluralOptions,
  InferPartsType,
  Locale,
  Message,
  MessageContext,
  MessageFunctionContext,
  MessageFunctionResult,
  MessageId,
  MessagePart,
  MessageValue,
  MessageValues,
  PluralRule,
  SelectOptions,
} from './types'

import { KanjouError, KanjouFormatError } from './errors'
import { getIntlFormatter, isCompiledIntlOptions } from './formatters'

const JSON_NUMBER_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/
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
const EMPTY_OPTIONS = Object.freeze({})

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
  // oxlint-disable-next-line typescript/no-base-to-string
  return String(result)
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

export function rtNumber(
  ctx: MessageContext,
  value: unknown,
  opt?: FormatNumberOptions | CompiledIntlOptions<FormatNumberOptions>,
  fallback?: string,
): string {
  const num = parseNumberOperand(value)
  if (num === null) return fallback ?? '{:number}'
  return getIntlFormatter(ctx.cache.number, ctx.locale, opt, Intl.NumberFormat).format(num)
}

export function rtDate(
  ctx: MessageContext,
  value: unknown,
  opt?: FormatDateTimeOptions | CompiledIntlOptions<FormatDateTimeOptions>,
  fallback?: string,
): string {
  const d = parseDateOperand(value)
  if (d === null) return fallback ?? '{:date}'
  return getIntlFormatter(ctx.cache.dateTime, ctx.locale, opt, Intl.DateTimeFormat).format(d)
}

export function rtInteger(value: unknown): number | bigint | null {
  const num = parseNumberOperand(value)
  if (num === null || typeof num === 'bigint') return num
  return Number.isFinite(num) ? Math.round(num) : num
}

export function rtOffset(value: unknown, delta: unknown, negate?: boolean): number | bigint | null {
  const num = parseNumberOperand(value)
  if (num === null) return null
  const parsedDelta = parseNumberOperand(delta)
  if (parsedDelta === null) return null
  if (typeof parsedDelta === 'number' && (!Number.isInteger(parsedDelta) || parsedDelta < 0)) {
    return null
  }
  if (typeof parsedDelta === 'bigint' && parsedDelta < 0n) return null
  if (typeof num === 'bigint') {
    const d = typeof parsedDelta === 'bigint' ? parsedDelta : BigInt(parsedDelta)
    return negate ? num - d : num + d
  }
  const d = Number(parsedDelta)
  if (!Number.isFinite(d)) return null
  return negate ? num - d : num + d
}

export function rtCurrencyOpts(
  base: FormatNumberOptions,
  fractionDigits: unknown,
): FormatNumberOptions {
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

export function rtDateOpts(
  base: FormatDateTimeOptions | undefined,
  input: DynamicDateTimeOptionsInput,
): FormatDateTimeOptions {
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

export function rtPlural(
  ctx: MessageContext,
  value: unknown,
  opt?: FormatPluralOptions,
): PluralRule {
  const num = parseNumberOperand(value)
  return getIntlFormatter(ctx.cache.plural, ctx.locale, opt, Intl.PluralRules).select(
    num === null ? Number.NaN : Number(num),
  )
}

export function rtNumberForSelection(
  value: unknown,
  options?: SelectOptions | CompiledIntlOptions<SelectOptions>,
): number | bigint | null {
  const num = parseNumberOperand(value)
  if (num === null) return null
  const opt = isCompiledIntlOptions(options) ? options[0] : options
  if (opt?.style === 'percent') {
    return typeof num === 'bigint' ? num * 100n : num * 100
  }
  return num
}

export function rtSelectPlural(
  ctx: MessageContext,
  num: number | bigint | null,
  options?: SelectOptions | CompiledIntlOptions<SelectOptions>,
): PluralRule | null {
  const opt = isCompiledIntlOptions(options) ? options[0] : options
  if (num === null || opt?.select === 'exact') return null
  return getIntlFormatter(ctx.cache.plural, ctx.locale, options, Intl.PluralRules).select(
    Number(num),
  )
}

export function rtSelect(
  ctx: MessageContext,
  value: unknown,
  keys: ReadonlySet<string>,
  opt?: SelectOptions,
): string | null {
  if (typeof value === 'object' && value !== null) {
    const result = value as MessageValue
    if (typeof result.selectKey === 'function') {
      const key = result.selectKey(new Set(keys))
      return key !== null && keys.has(key) ? key : null
    }
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    const num = rtNumberForSelection(value, opt)
    if (num === null) return null
    const exact = String(num)
    if (keys.has(exact)) return exact
    const category = rtSelectPlural(ctx, num, opt)
    return category !== null && keys.has(category) ? category : null
  }

  const key = value === null || value === undefined ? '' : coerceMessageResult(value)
  if (keys.has(key)) return key
  const normalized = key.normalize()
  return normalized !== key && keys.has(normalized) ? normalized : null
}

export function rtStr(value: unknown): string {
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
  }
  return coerceMessageResult(value)
}

export function rtVal(ctx: MessageContext, value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'number' || typeof value === 'bigint') {
    return rtNumber(ctx, value, undefined, fallback)
  }
  return rtStr(value)
}

const fnContextCache = new WeakMap<
  MessageContext,
  {
    defaultContext: MessageFunctionContext
    contextsByKeys?: WeakMap<readonly string[], MessageFunctionContext>
  }
>()

export function rtFn(
  ctx: MessageContext,
  name: string,
  operand: unknown,
  exprOpt?: Record<string, unknown>,
  literalOptionKeys?: readonly string[],
): MessageFunctionResult {
  const functions = ctx.functions
  const func = functions && Object.hasOwn(functions, name) ? functions[name] : undefined
  if (!func) {
    throw new KanjouError(`Unknown message function ":${name}"`)
  }
  let entry = fnContextCache.get(ctx)
  if (!entry) {
    entry = {
      defaultContext: {
        locale: ctx.locale,
        number: (value, opt) => rtNumber(ctx, value, opt),
        date: (value, opt) => rtDate(ctx, value, opt),
        plural: (value, opt) => rtPlural(ctx, value, opt),
        select: (value, keys, opt) => rtSelect(ctx, value, keys, opt),
        literalOptionKeys: new Set<string>(),
      },
    }
    fnContextCache.set(ctx, entry)
  }
  let context = entry.defaultContext
  if (literalOptionKeys?.length) {
    const contexts = (entry.contextsByKeys ??= new WeakMap())
    const previous = contexts.get(literalOptionKeys)
    if (previous) {
      context = previous
    } else {
      context = { ...entry.defaultContext, literalOptionKeys: new Set(literalOptionKeys) }
      contexts.set(literalOptionKeys, context)
    }
  }
  return func(context, exprOpt ?? EMPTY_OPTIONS, operand)
}

export function rtParts(value: unknown): MessagePart[] {
  if (value === null || value === undefined) return []
  if (typeof value === 'object' && typeof (value as MessageValue).toParts === 'function') {
    return (value as MessageValue).toParts!()
  }
  const text = rtStr(value)
  return text === '' ? [] : [{ type: 'text', value: text }]
}

export function formatMessage<Id extends string = MessageId>(
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values: MessageValues<Id> | undefined,
  context: MessageContext,
): string {
  const message = resolveMessage(messages, id)
  if (typeof message === 'string') return message
  if (typeof message !== 'function' && (message === null || typeof message !== 'object')) return id

  try {
    if (typeof message === 'function') return message(values, context)
    if ('render' in message && typeof message.render === 'function') {
      return message.render(values, context, false)
    }
    if ('parts' in message && typeof message.parts === 'function') {
      return partsToString(message.parts(values, context))
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
  context: MessageContext,
): MessagePart<InferPartsType<Id extends MessageId ? Id : never>>[]
export function formatMessageParts<Id extends string>(
  locale: Locale,
  messages: Readonly<Record<string, Message>>,
  id: Id,
  values: MessageValues<Id> | undefined,
  context: MessageContext,
): MessagePart[] {
  const message = resolveMessage(messages, id)
  if (typeof message === 'string') return toTextParts(message)
  if (typeof message !== 'function' && (message === null || typeof message !== 'object')) return []

  try {
    if (typeof message === 'function') {
      return toTextParts(message(values, context))
    }
    if ('render' in message && typeof message.render === 'function') {
      return message.render(values, context, true)
    }
    if ('parts' in message && typeof message.parts === 'function') {
      return message.parts(values, context)
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
