import type { Locale } from '../types'
import type { Formatters } from './index'

export function formatDisplayName(
  getDisplayNames: Formatters['getDisplayNames'],
  locale: Locale,
  code: string,
  options: Intl.DisplayNamesOptions,
): string | undefined {
  return getDisplayNames(locale, options).of(code)
}
