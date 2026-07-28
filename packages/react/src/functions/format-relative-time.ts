import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export type FormatRelativeTimeOptions = Intl.RelativeTimeFormatOptions & {
  unit: Intl.RelativeTimeFormatUnit
}

export interface FormatRelativeTime {
  (value: number, options: FormatRelativeTimeOptions): string
}

export function formatRelativeTime(
  getRelativeTimeFormat: Formatters['getRelativeTimeFormat'],
  locale: Locale,
  value: number,
  options: FormatRelativeTimeOptions,
): string {
  const { unit, ..._options } = options
  return getRelativeTimeFormat(locale, _options).format(value, unit)
}

export function createFormatRelativeTime(
  getRelativeTimeFormat: Formatters['getRelativeTimeFormat'],
  locale: Locale,
): FormatRelativeTime {
  return (value, options) => formatRelativeTime(getRelativeTimeFormat, locale, value, options)
}
