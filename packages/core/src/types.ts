export interface MessageTextPart {
  type: 'text'
  value: string
}

export interface MessageMarkupPart {
  type: 'markup'
  kind: 'open' | 'standalone' | 'close'
  name: string
  options?: Record<string, unknown> | undefined
}

export interface MessageFallbackPart {
  type: 'fallback'
  source: string
}

export interface MessageFormattedPart<P extends string = string> {
  type: P
  locale?: string | undefined
  dir?: 'ltr' | 'rtl' | 'auto' | undefined
  value?: unknown
  parts?: readonly { type: string; value: string }[] | undefined
}

export type MessagePart<P extends string = string> =
  | MessageTextPart
  | MessageMarkupPart
  | MessageFallbackPart
  | ([P] extends [never] ? never : MessageFormattedPart<P>)

export interface MessageFunctionContext {
  readonly locale: Locale
  readonly number: (value: unknown, options?: FormatNumberOptions) => string
  readonly date: (value: unknown, options?: FormatDateTimeOptions) => string
  readonly plural: MessageRuntime['plural']
  readonly select: MessageRuntime['select']
  readonly literalOptionKeys: ReadonlySet<string>
}

export interface MessageValue<T extends string = string, P extends string = T> {
  readonly type?: T | undefined
  readonly value?: unknown
  selectKey?: ((keys: Set<string>) => string | null) | undefined
  toParts?: (() => MessagePart<P>[]) | undefined
  toString?: (() => string) | undefined
  valueOf?: (() => unknown) | undefined
}

export type CompiledIntlOptions<Options> = readonly [options: Options, cacheKey: string]

export type SelectOptions = FormatPluralOptions & {
  select?: 'exact' | undefined
  style?: string | undefined
}

export interface DynamicDateTimeOptionsInput {
  readonly kind: 'date' | 'time' | 'datetime'
  readonly hasDirectStyle?: boolean | undefined
  readonly hasDirectDateField?: boolean | undefined
  readonly hasDirectTimeField?: boolean | undefined
  readonly hasDirectTimeZoneName?: boolean | undefined
  readonly fields?: unknown
  readonly length?: unknown
  readonly precision?: unknown
  readonly timeZoneStyle?: unknown
  readonly hour12?: unknown
}

export interface MessageRuntime {
  readonly locale: Locale
  readonly number: (
    value: unknown,
    options?: FormatNumberOptions | CompiledIntlOptions<FormatNumberOptions>,
    fallback?: string,
  ) => string
  readonly date: (
    value: unknown,
    options?: FormatDateTimeOptions | CompiledIntlOptions<FormatDateTimeOptions>,
    fallback?: string,
  ) => string
  readonly integer: (value: unknown) => number | bigint | null
  readonly offset: (value: unknown, delta: unknown, negate?: boolean) => number | bigint | null
  readonly currencyOpts: (base: FormatNumberOptions, fractionDigits: unknown) => FormatNumberOptions
  readonly dateOpts: (
    base: FormatDateTimeOptions | undefined,
    input: DynamicDateTimeOptionsInput,
  ) => FormatDateTimeOptions
  readonly plural: (value: unknown, options?: FormatPluralOptions) => PluralRule
  readonly select: (
    value: unknown,
    keys: ReadonlySet<string>,
    options?: SelectOptions,
  ) => string | null
  readonly numberForSelection: (
    value: unknown,
    options?: SelectOptions | CompiledIntlOptions<SelectOptions>,
  ) => number | bigint | null
  readonly selectPlural: (
    value: number | bigint | null,
    options?: SelectOptions | CompiledIntlOptions<SelectOptions>,
  ) => PluralRule | null
  readonly fn: (
    name: string,
    operand: unknown,
    options?: Record<string, unknown>,
    literalOptionKeys?: readonly string[],
  ) => MessageFunctionResult
  readonly str: (value: unknown) => string
  readonly parts: (value: unknown) => MessagePart[]
}

export type MessageFunctionResult<T extends string = string, P extends string = T> =
  | string
  | MessageValue<T, P>

export interface Register {}

export type CompiledMessage = (values?: Record<string, any>, runtime?: MessageRuntime) => string
export interface CompiledPartsMessage {
  readonly parts: (values?: Record<string, any>, runtime?: MessageRuntime) => MessagePart[]
}
export interface CompiledRichMessage {
  readonly render: {
    (values: Record<string, any> | undefined, runtime: MessageRuntime, asParts: false): string
    (values: Record<string, any> | undefined, runtime: MessageRuntime, asParts: true): MessagePart[]
  }
}
export type Message = string | CompiledMessage | CompiledPartsMessage | CompiledRichMessage
export type DefaultMessageValue = string | number
export type DefaultMessages = Record<string, Record<string, DefaultMessageValue>>

export type MapPartsType<Id extends MessageId> = {
  [Value in keyof Messages[Id]]: Messages[Id][Value] extends {
    __fn: infer FunctionName extends keyof Functions
  }
    ? Functions[FunctionName] extends MessageFunction<any, any, any, infer PartsType>
      ? PartsType
      : never
    : never
}
export type InferPartsType<Id extends MessageId> = MapPartsType<Id>[keyof MapPartsType<Id>]

export type MessageFunction<
  Options = Record<string, unknown>,
  Input = unknown,
  MessageType extends string = string,
  PartsType extends string = MessageType,
> = (
  context: MessageFunctionContext,
  options: Readonly<Options>,
  input?: Input,
) => MessageFunctionResult<MessageType, PartsType>

export type BuiltinFunctionName = keyof BuiltinFunctions

export type MessageFunctions = {
  [K in BuiltinFunctionName]?: never
} & Partial<Omit<Functions, BuiltinFunctionName>> &
  Record<string, MessageFunction<any, any, any, any> | undefined>

export interface MessageFormatOptions {
  functions?: MessageFunctions | undefined
}

export interface DefaultFunctions {
  string: MessageFunction<Record<string, unknown>, unknown, 'string', never>

  number: MessageFunction<
    Partial<
      Intl.NumberFormatOptions &
        Intl.PluralRulesOptions & { select?: 'exact' | 'cardinal' | 'ordinal' }
    >,
    NumberLike,
    'number',
    never
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
    'number',
    never
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
    'number',
    never
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
    'number',
    never
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
    'number',
    never
  >

  date: MessageFunction<Partial<Intl.DateTimeFormatOptions>, DateLike | string, 'datetime', never>

  datetime: MessageFunction<
    Partial<Intl.DateTimeFormatOptions>,
    DateLike | string,
    'datetime',
    never
  >

  time: MessageFunction<Partial<Intl.DateTimeFormatOptions>, DateLike | string, 'datetime', never>

  unit: MessageFunction<
    Partial<Intl.NumberFormatOptions> & {
      unit?: string
      unitDisplay?: 'short' | 'long' | 'narrow'
    },
    NumberLike,
    'number',
    never
  >
}

export type BuiltinFunctions = DefaultFunctions & DraftFunctions

export type Locale = Register extends { locale: infer RegisteredLocale } ? RegisteredLocale : string
export type FlatLocale = Register extends { flatLocales: infer RegisteredFlatLocale }
  ? RegisteredFlatLocale
  : Locale
export type Namespace = Register extends { namespace: infer RegisteredNamespace }
  ? RegisteredNamespace
  : string
export type LocaleNamespaces = Register extends {
  localeNamespaces: infer RegisteredLocaleNamespaces extends Record<string, string>
}
  ? RegisteredLocaleNamespaces
  : Record<Locale, Namespace>
export type Messages = Register extends { messages: infer RegisteredMessages }
  ? RegisteredMessages
  : DefaultMessages
export type Functions = Register extends { functions: infer RegisteredFunctions }
  ? RegisteredFunctions & BuiltinFunctions
  : BuiltinFunctions

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
