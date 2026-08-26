import { formatRelativeTime } from '@kanjou/core'

import { useKanjouContext } from '../context'

type UseFormatRelativeTimeReturn = (
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  options?: Intl.RelativeTimeFormatOptions,
) => string

export function useFormatRelativeTime(): UseFormatRelativeTimeReturn {
  const { formatters, locale } = useKanjouContext()

  return (value, unit, options) =>
    formatRelativeTime(formatters.getRelativeTimeFormat, locale, value, unit, options)
}
