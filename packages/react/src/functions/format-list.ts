import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export interface FormatList {
  (list: Iterable<string>, options?: Intl.ListFormatOptions): string
}

export function formatList(
  getListFormat: Formatters['getListFormat'],
  locale: Locale,
  list: Iterable<string>,
  options?: Intl.ListFormatOptions,
): string {
  return getListFormat(locale, options).format(list)
}

export function createFormatList(
  getListFormat: Formatters['getListFormat'],
  locale: Locale,
): FormatList {
  return (list, options) => formatList(getListFormat, locale, list, options)
}
