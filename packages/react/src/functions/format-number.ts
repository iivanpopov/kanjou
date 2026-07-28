import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export interface FormatNumber {
  (value: number | bigint, options?: Intl.NumberFormatOptions): string
}

export function formatNumber(
  getNumberFormat: Formatters['getNumberFormat'],
  locale: Locale,
  value: number | bigint,
  options?: Intl.NumberFormatOptions,
): string {
  return getNumberFormat(locale, options).format(value)
}

export function createFormatNumber(
  getNumberFormat: Formatters['getNumberFormat'],
  locale: Locale,
): FormatNumber {
  return (value, options) => formatNumber(getNumberFormat, locale, value, options)
}
