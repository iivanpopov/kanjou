import { formatPlural } from '@kanjou/core'

import { useKanjouContext } from '../context'

type UseFormatPluralReturn = (
  number: number,
  options?: Intl.PluralRulesOptions,
) => Intl.LDMLPluralRule

export function useFormatPlural(): UseFormatPluralReturn {
  const { formatters, locale } = useKanjouContext()

  return (number, options) => formatPlural(formatters.getPluralRules, locale, number, options)
}
