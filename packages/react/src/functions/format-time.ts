import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export interface FormatTime {
  (value: number | Date, options?: Intl.DateTimeFormatOptions): string
}

export function formatTime(
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  locale: Locale,
  value: number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getDateTimeFormat(locale, options).format(value)
}

export function createFormatTime(
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  locale: Locale,
): FormatTime {
  return (value, options) => formatTime(getDateTimeFormat, locale, value, options)
}
