import type { MessageFormat, Model, MessageFormatOptions as MfOptions } from 'messageformat'
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

export type MessageFormatOptions<
  MessageType extends string = string,
  PartsType extends string = MessageType,
> = Omit<MfOptions<MessageType, PartsType>, 'functions'> & {
  functions?: MessageFunctions
}

export type MessageFormatFactory = (
  locale: string,
  message: Message,
  options?: MessageFormatOptions,
) => MessageFormat

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
        : Messages[Id][Value] extends string
          ? Messages[Id][Value]
          : Messages[Id][Value] extends number
            ? Messages[Id][Value]
            : Messages[Id][Value] extends bigint
              ? Messages[Id][Value]
              : DefaultMessageValue
    }
  : Record<string, any>

export type DateLike = number | Date | Intl.FormattableTemporalObject
export type FormatDateTimeOptions = Intl.DateTimeFormatOptions

export type NumberLike = number | bigint | Intl.StringNumericLiteral
export type FormatNumberOptions = Intl.NumberFormatOptions

export type PluralRule = Intl.LDMLPluralRule
export type FormatPluralOptions = Intl.PluralRulesOptions

export type ListLike = Iterable<string>
export type FormatListOptions = Intl.ListFormatOptions

export type FormatDisplayNameOptions = Intl.DisplayNamesOptions

export type Unit = Intl.RelativeTimeFormatUnit
export type FormatRelativeTimeOptions = Intl.RelativeTimeFormatOptions

export type Duration = Parameters<Intl.DurationFormat['format']>[0]
export type FormatDurationOptions = Intl.DurationFormatOptions
