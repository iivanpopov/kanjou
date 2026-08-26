import { formatTime } from '@kanjou/core'

import { useKanjouContext } from '../context'

type UseFormatTimeReturn = (value: number | Date, options?: Intl.DateTimeFormatOptions) => string

export function useFormatTime(): UseFormatTimeReturn {
  const { formatters, locale } = useKanjouContext()

  return (value, options) => formatTime(formatters.getDateTimeFormat, locale, value, options)
}
