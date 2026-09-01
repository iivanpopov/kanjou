import type { NumberLike, FormatNumberOptions } from '@kanjou/core'

import { formatNumber } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatNumberReturn = (number: NumberLike, options?: FormatNumberOptions) => string

export function useFormatNumber(): UseFormatNumberReturn {
  const { locale } = use(KanjouContext)

  return (number, options) => formatNumber(locale, number, options)
}
