import { formatDate } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatDateReturn = (
  date: number | Date,
  options?: Intl.DateTimeFormatOptions,
) => string

export function useFormatDate(): UseFormatDateReturn {
  const { locale } = use(KanjouContext)

  return (date, options) => formatDate(locale, date, options)
}
