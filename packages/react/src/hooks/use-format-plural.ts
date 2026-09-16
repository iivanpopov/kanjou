import type { FormatPluralOptions, PluralRule } from '@kanjou/core'

import { formatPlural } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatPluralReturn = (number: number, options?: FormatPluralOptions) => PluralRule

export function useFormatPlural(): UseFormatPluralReturn {
  const { locale } = use(KanjouContext)

  return (number, options) => formatPlural(locale, number, options)
}
