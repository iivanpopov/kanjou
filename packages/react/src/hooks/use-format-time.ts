import { formatTime } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatTimeReturn = (
  date: number | Date,
  options?: Intl.DateTimeFormatOptions,
) => string

export function useFormatTime(): UseFormatTimeReturn {
  const { locale } = use(KanjouContext)

  return (value, options) => formatTime(locale, value, options)
}
