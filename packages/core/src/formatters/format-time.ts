import type { Locale } from '../types'
import type { Formatters } from './index'

export function formatTime(
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  locale: Locale,
  date: number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  return getDateTimeFormat(locale, options).format(date)
}
