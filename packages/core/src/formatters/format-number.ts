import type { Locale } from '../types'
import type { Formatters } from './index'

export function formatNumber(
  getNumberFormat: Formatters['getNumberFormat'],
  locale: Locale,
  number: number | bigint,
  options?: Intl.NumberFormatOptions,
): string {
  return getNumberFormat(locale, options).format(number)
}
