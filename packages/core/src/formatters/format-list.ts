import type { Locale } from '../types'
import type { Formatters } from './index'

export function formatList(
  getListFormat: Formatters['getListFormat'],
  locale: Locale,
  list: Iterable<string>,
  options?: Intl.ListFormatOptions,
): string {
  return getListFormat(locale, options).format(list)
}
