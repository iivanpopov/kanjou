import type { Unit, FormatRelativeTimeOptions } from '@kanjou/core'

import { formatRelativeTime } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatRelativeTimeReturn = (
  value: number,
  unit: Unit,
  options?: FormatRelativeTimeOptions,
) => string

export function useFormatRelativeTime(): UseFormatRelativeTimeReturn {
  const { locale } = use(KanjouContext)

  return (value, unit, options) => formatRelativeTime(locale, value, unit, options)
}
