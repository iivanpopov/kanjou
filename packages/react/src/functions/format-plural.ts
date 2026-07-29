import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export interface FormatPlural {
  (value: number, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule
}

export function formatPlural(
  getPluralRules: Formatters['getPluralRules'],
  locale: Locale,
  value: number,
  options?: Intl.PluralRulesOptions,
): Intl.LDMLPluralRule {
  return getPluralRules(locale, options).select(value)
}

export function createFormatPlural(
  getPluralRules: Formatters['getPluralRules'],
  locale: Locale,
): FormatPlural {
  return (value, options) => formatPlural(getPluralRules, locale, value, options)
}
