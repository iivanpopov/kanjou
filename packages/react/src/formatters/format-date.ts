import type { Locale } from '../types'
import type { Formatters } from './index'

export interface FormatDate {
  (value: number | Date, options?: Intl.DateTimeFormatOptions): string
}

export function createFormatDate(
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  locale: Locale,
): FormatDate {
  return (value, options) => getDateTimeFormat(locale, options).format(value)
}
