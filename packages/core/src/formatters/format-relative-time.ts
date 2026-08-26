import type { Locale } from '../types'
import type { Formatters } from './index'

export function formatRelativeTime(
  getRelativeTimeFormat: Formatters['getRelativeTimeFormat'],
  locale: Locale,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
): string {
  return getRelativeTimeFormat(locale, options).format(value, unit)
}
