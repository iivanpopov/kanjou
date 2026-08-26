import { formatDate } from '@kanjou/core'

import { useKanjouContext } from '../context'

type UseFormatDateReturn = (date: number | Date, options?: Intl.DateTimeFormatOptions) => string

export function useFormatDate(): UseFormatDateReturn {
  const { formatters, locale } = useKanjouContext()

  return (date, options) => formatDate(formatters.getDateTimeFormat, locale, date, options)
}
