import type { Locale } from '../types'
import type { Formatters } from './index'

export type FormatRelativeTimeOptions = Intl.RelativeTimeFormatOptions

export interface FormatRelativeTime {
  (value: number, unit: Intl.RelativeTimeFormatUnit, options?: FormatRelativeTimeOptions): string
}

export function createFormatRelativeTime(
  getRelativeTimeFormat: Formatters['getRelativeTimeFormat'],
  locale: Locale,
): FormatRelativeTime {
  return (value, unit, options) => getRelativeTimeFormat(locale, options).format(value, unit)
}
