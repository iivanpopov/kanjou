import type { Model } from 'messageformat'
import type { MessageFunctionContext, MessageValue } from 'messageformat/functions'

export type { MessageFormat, MessageMarkupPart, MessagePart } from 'messageformat'

export interface Register {}

export type CompiledMessage = (values?: Record<string, any>) => string
export type Message = string | CompiledMessage | Model.Message
export type DefaultMessageValue = string | number
export type DefaultMessages = Record<string, Record<string, DefaultMessageValue>>

export type MapPartsType<Id extends MessageId> = {
  [Value in keyof Messages[Id]]: Messages[Id][Value] extends {
    __fn: infer FunctionName extends keyof Functions
  }
    ? Functions[FunctionName] extends MessageFunction<any, any, any, infer PartsType>
      ? PartsType
      : 'string'
    : Messages[Id][Value] extends number | bigint
      ? 'number'
      : 'string'
}
export type InferPartsType<Id extends MessageId> = MapPartsType<Id>[keyof MapPartsType<Id>]

export type MessageFunction<
  Options = Record<string, unknown>,
  Input = unknown,
  MessageType extends string = string,
  PartsType extends string = MessageType,
> = (
  context: MessageFunctionContext,
  options: Options,
  input?: Input,
) => MessageValue<MessageType, PartsType>

export type MessageFunctions = Partial<Functions> &
  Record<string, MessageFunction<any, any, any, any> | undefined>

export interface MessageFormatOptions {
  bidiIsolation?: 'default' | 'none' | undefined
  dir?: 'ltr' | 'rtl' | 'auto' | undefined
  localeMatcher?: 'best fit' | 'lookup' | undefined
  functions?: MessageFunctions | undefined
}

export interface DefaultFunctions {
  string: MessageFunction<Record<string, unknown>, unknown, 'string'>

  number: MessageFunction<
    Partial<
      Intl.NumberFormatOptions &
        Intl.PluralRulesOptions & { select?: 'exact' | 'cardinal' | 'ordinal' }
    >,
    NumberLike,
    'number'
  >

  integer: MessageFunction<
    Partial<{
      minimumIntegerDigits: number
      maximumSignificantDigits: number
      select: 'exact' | 'cardinal' | 'ordinal'
      signDisplay: Intl.NumberFormatOptions['signDisplay']
      useGrouping: Intl.NumberFormatOptions['useGrouping']
    }>,
    NumberLike,
    'number'
  >

  offset: MessageFunction<
    Partial<
      Intl.NumberFormatOptions & {
        offset?: number
        add?: number
        subtract?: number
      }
    >,
    NumberLike,
    'number'
  >
}

export interface DraftFunctions {
  currency: MessageFunction<
    Partial<Intl.NumberFormatOptions> & {
      currency?: string
      currencyDisplay?: 'code' | 'symbol' | 'narrowSymbol' | 'name'
      currencySign?: 'standard' | 'accounting'
    },
    NumberLike,
    'number'
  >

  percent: MessageFunction<
    Partial<{
      minimumFractionDigits: number
      maximumFractionDigits: number
      minimumSignificantDigits: number
      maximumSignificantDigits: number
      roundingMode: string
      roundingPriority: string
      signDisplay: Intl.NumberFormatOptions['signDisplay']
      trailingZeroDisplay: string
      useGrouping: Intl.NumberFormatOptions['useGrouping']
    }>,
    NumberLike,
    'number'
  >

  date: MessageFunction<Partial<Intl.DateTimeFormatOptions>, DateLike | string, 'datetime'>

  datetime: MessageFunction<Partial<Intl.DateTimeFormatOptions>, DateLike | string, 'datetime'>

  time: MessageFunction<Partial<Intl.DateTimeFormatOptions>, DateLike | string, 'datetime'>

  unit: MessageFunction<
    Partial<Intl.NumberFormatOptions> & {
      unit?: string
      unitDisplay?: 'short' | 'long' | 'narrow'
    },
    NumberLike,
    'number'
  >
}

export type Locale = Register extends { locale: infer RegisteredLocale } ? RegisteredLocale : string
export type Namespace = Register extends { namespace: infer RegisteredNamespace }
  ? RegisteredNamespace
  : string
export type Messages = Register extends { messages: infer RegisteredMessages }
  ? RegisteredMessages
  : DefaultMessages
export type Functions = Register extends { functions: infer RegisteredFunctions }
  ? RegisteredFunctions & DefaultFunctions
  : DefaultFunctions

export type MessageId = keyof Messages

export type InferFunctionInput<FunctionName extends keyof Functions> =
  Functions[FunctionName] extends MessageFunction<any, infer Input> ? Input : undefined

export type MessageValues<Id extends string = MessageId> = Id extends keyof Messages
  ? {
      [Value in keyof Messages[Id]]: Messages[Id][Value] extends {
        __fn: infer FunctionName extends keyof Functions
      }
        ? InferFunctionInput<FunctionName>
        : Messages[Id][Value] extends string | number | bigint
          ? Messages[Id][Value]
          : DefaultMessageValue
    }
  : Record<string, any>

export interface IntlDurationLike {
  years?: number | undefined
  months?: number | undefined
  weeks?: number | undefined
  days?: number | undefined
  hours?: number | undefined
  minutes?: number | undefined
  seconds?: number | undefined
  milliseconds?: number | undefined
  microseconds?: number | undefined
  nanoseconds?: number | undefined
}

export interface IntlDurationFormatOptionsLike {
  localeMatcher?: 'best fit' | 'lookup' | undefined
  style?: 'long' | 'short' | 'narrow' | 'digital' | undefined
  years?: 'long' | 'short' | 'narrow' | undefined
  yearsDisplay?: 'always' | 'auto' | undefined
  months?: 'long' | 'short' | 'narrow' | undefined
  monthsDisplay?: 'always' | 'auto' | undefined
  weeks?: 'long' | 'short' | 'narrow' | undefined
  weeksDisplay?: 'always' | 'auto' | undefined
  days?: 'long' | 'short' | 'narrow' | undefined
  daysDisplay?: 'always' | 'auto' | undefined
  hours?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit' | undefined
  hoursDisplay?: 'always' | 'auto' | undefined
  minutes?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit' | undefined
  minutesDisplay?: 'always' | 'auto' | undefined
  seconds?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit' | undefined
  secondsDisplay?: 'always' | 'auto' | undefined
  milliseconds?: 'long' | 'short' | 'narrow' | 'numeric' | undefined
  millisecondsDisplay?: 'always' | 'auto' | undefined
  microseconds?: 'long' | 'short' | 'narrow' | 'numeric' | undefined
  microsecondsDisplay?: 'always' | 'auto' | undefined
  nanoseconds?: 'long' | 'short' | 'narrow' | 'numeric' | undefined
  nanosecondsDisplay?: 'always' | 'auto' | undefined
  fractionalDigits?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined
}

export type DateLike = NonNullable<Parameters<Intl.DateTimeFormat['format']>[0]>
export type FormatDateTimeOptions = Intl.DateTimeFormatOptions

export type NumberLike = Parameters<Intl.NumberFormat['format']>[0]
export type FormatNumberOptions = Intl.NumberFormatOptions

export type PluralRule = Intl.LDMLPluralRule
export type FormatPluralOptions = Intl.PluralRulesOptions

export type ListLike = Iterable<string>
export type FormatListOptions = Intl.ListFormatOptions

export type FormatDisplayNameOptions = Intl.DisplayNamesOptions

export type Unit = Intl.RelativeTimeFormatUnit
export type FormatRelativeTimeOptions = Intl.RelativeTimeFormatOptions

export type Duration = typeof Intl extends {
  DurationFormat: abstract new (...args: any[]) => { format(duration: infer D): string }
}
  ? D
  : IntlDurationLike

export type FormatDurationOptions = typeof Intl extends {
  DurationFormat: abstract new (locales?: any, options?: infer O) => any
}
  ? NonNullable<O>
  : IntlDurationFormatOptionsLike
