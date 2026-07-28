import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export interface FormatDate {
  (value: number | Date, options?: Intl.DateTimeFormatOptions): string
}

export function formatDate(
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  locale: Locale,
  value: number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getDateTimeFormat(locale, options).format(value)
}

export function createFormatDate(
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  locale: Locale,
): FormatDate {
  return (value, options) => formatDate(getDateTimeFormat, locale, value, options)
}
