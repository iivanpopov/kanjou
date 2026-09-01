import type { Duration, FormatDurationOptions } from '@kanjou/core'

import { formatDuration } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatDurationReturn = (
  duration: Duration,
  options?: FormatDurationOptions,
) => string

export function useFormatDuration(): UseFormatDurationReturn {
  const { locale } = use(KanjouContext)

  return (duration, options) => formatDuration(locale, duration, options)
}
