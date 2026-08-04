import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export type FormatRelativeTimeOptions = Intl.RelativeTimeFormatOptions

export interface FormatRelativeTime {
  (value: number, unit: Intl.RelativeTimeFormatUnit, options: FormatRelativeTimeOptions): string
}

export function formatRelativeTime(
  getRelativeTimeFormat: Formatters['getRelativeTimeFormat'],
  locale: Locale,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options: FormatRelativeTimeOptions,
): string {
  return getRelativeTimeFormat(locale, options).format(value, unit)
}

export function createFormatRelativeTime(
  getRelativeTimeFormat: Formatters['getRelativeTimeFormat'],
  locale: Locale,
): FormatRelativeTime {
  return (value, unit, options) =>
    formatRelativeTime(getRelativeTimeFormat, locale, value, unit, options)
}
