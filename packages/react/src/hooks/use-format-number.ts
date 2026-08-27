import { formatNumber } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatNumberReturn = (
  number: number | bigint,
  options?: Intl.NumberFormatOptions,
) => string

export function useFormatNumber(): UseFormatNumberReturn {
  const { locale } = use(KanjouContext)

  return (number, options) => formatNumber(locale, number, options)
}
