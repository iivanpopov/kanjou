import type { Locale } from '../types'
import type { Formatters } from './index'

export interface FormatDisplayName {
  (value: string, options: Intl.DisplayNamesOptions): string | undefined
}

export function createFormatDisplayName(
  getDisplayNames: Formatters['getDisplayNames'],
  locale: Locale,
): FormatDisplayName {
  return (value, options) => getDisplayNames(locale, options).of(value)
}
