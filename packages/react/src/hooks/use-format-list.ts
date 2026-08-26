import { formatList } from '@kanjou/core'

import { useKanjouContext } from '../context'

type UseFormatListReturn = (list: Iterable<string>, options?: Intl.ListFormatOptions) => string

export function useFormatList(): UseFormatListReturn {
  const { formatters, locale } = useKanjouContext()

  return (value, options) => formatList(formatters.getListFormat, locale, value, options)
}
