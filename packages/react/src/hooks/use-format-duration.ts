import { formatDuration } from '@kanjou/core'

import { useKanjouContext } from '../context'

export type Duration = Parameters<Intl.DurationFormat['format']>[0]

type UseFormatDurationReturn = (duration: Duration, options?: Intl.DurationFormatOptions) => string

export function useFormatDuration(): UseFormatDurationReturn {
  const { formatters, locale } = useKanjouContext()

  return (duration, options) =>
    formatDuration(formatters.getDurationFormat, locale, duration, options)
}
