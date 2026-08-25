import type { Locale } from '../types'
import type { Formatters } from './index'

export interface FormatNumber {
  (value: number | bigint, options?: Intl.NumberFormatOptions): string
}

export function createFormatNumber(
  getNumberFormat: Formatters['getNumberFormat'],
  locale: Locale,
): FormatNumber {
  return (value, options) => getNumberFormat(locale, options).format(value)
}
