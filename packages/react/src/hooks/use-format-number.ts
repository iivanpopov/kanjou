import { formatNumber } from '@kanjou/core'

import { useKanjouContext } from '../context'

type UseFormatNumberReturn = (number: number | bigint, options?: Intl.NumberFormatOptions) => string

export function useFormatNumber(): UseFormatNumberReturn {
  const { formatters, locale } = useKanjouContext()

  return (number, options) => formatNumber(formatters.getNumberFormat, locale, number, options)
}
