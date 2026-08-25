import type { Locale } from '../types'
import type { Formatters } from './index'

export interface FormatList {
  (list: Iterable<string>, options?: Intl.ListFormatOptions): string
}

export function createFormatList(
  getListFormat: Formatters['getListFormat'],
  locale: Locale,
): FormatList {
  return (list, options) => getListFormat(locale, options).format(list)
}
