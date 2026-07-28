import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export interface FormatDisplayName {
  (value: string, options: Intl.DisplayNamesOptions): string | undefined
}

export function formatDisplayName(
  getDisplayNames: Formatters['getDisplayNames'],
  locale: Locale,
  value: string,
  options: Intl.DisplayNamesOptions,
): string | undefined {
  return getDisplayNames(locale, options).of(value)
}

export function createFormatDisplayName(
  getDisplayNames: Formatters['getDisplayNames'],
  locale: Locale,
): FormatDisplayName {
  return (value, options) => formatDisplayName(getDisplayNames, locale, value, options)
}
