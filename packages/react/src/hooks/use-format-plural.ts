import type { FormatPluralOptions } from '@kanjou/core'

import { formatPlural } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatPluralReturn = (
  number: number,
  options?: FormatPluralOptions,
) => Intl.LDMLPluralRule

export function useFormatPlural(): UseFormatPluralReturn {
  const { locale } = use(KanjouContext)

  return (number, options) => formatPlural(locale, number, options)
}
