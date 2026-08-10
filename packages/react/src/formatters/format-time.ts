import type { Locale } from '../types'
import type { Formatters } from './index'

export interface FormatTime {
  (value: number | Date, options?: Intl.DateTimeFormatOptions): string
}

export function createFormatTime(
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  locale: Locale,
): FormatTime {
  return (value, options) => getDateTimeFormat(locale, options).format(value)
}
