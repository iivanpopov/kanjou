import type { Locale } from './types'

export interface Formatters {
  dateTime: typeof Intl.DateTimeFormat
  duration: typeof Intl.DurationFormat
  list: typeof Intl.ListFormat
  number: typeof Intl.NumberFormat
  relativeTime: typeof Intl.RelativeTimeFormat
}

const formatters: Formatters = {
  dateTime: Intl.DateTimeFormat,
  duration: Intl.DurationFormat,
  list: Intl.ListFormat,
  number: Intl.NumberFormat,
  relativeTime: Intl.RelativeTimeFormat,
}

export interface KanjouCache {
  messages: Map<string, any>
  intl: { [Key in keyof Formatters]?: Map<string, any> }
}

export function createCache(): KanjouCache {
  return {
    messages: new Map(),
    intl: {},
  }
}

export function createIntl<FormatterKind extends keyof Formatters>(
  kind: FormatterKind,
  locale: Locale,
  options: ConstructorParameters<Formatters[FormatterKind]>[1] | undefined,
  cache: KanjouCache,
): InstanceType<Formatters[FormatterKind]> {
  const intlCache = (cache.intl[kind] ??= new Map<string, any>())
  const key = options ? `${locale}:${JSON.stringify(options)}` : locale

  const Formatter = formatters[kind] as any
  const instance = intlCache.getOrInsert(key, new Formatter(locale, options))

  if (intlCache.size > 100) intlCache.delete(intlCache.keys().next().value!)

  return instance
}
