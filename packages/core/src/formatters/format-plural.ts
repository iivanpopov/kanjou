import type { Locale } from '../types'
import type { Formatters } from './index'

export function formatPlural(
  getPluralRules: Formatters['getPluralRules'],
  locale: Locale,
  number: number,
  options?: Intl.PluralRulesOptions,
): Intl.LDMLPluralRule {
  return getPluralRules(locale, options).select(number)
}
