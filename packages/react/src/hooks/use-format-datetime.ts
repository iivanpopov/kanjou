import type { DateLike, FormatDateTimeOptions } from '@kanjou/core'

import { formatDateTime } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatDateTimeReturn = (date: DateLike, options?: FormatDateTimeOptions) => string

export function useFormatDateTime(): UseFormatDateTimeReturn {
  const { locale } = use(KanjouContext)

  return (date, options) => formatDateTime(locale, date, options)
}
