import type { Locale } from '../types'
import type { Formatters } from './index'

export interface FormatPlural {
  (value: number, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule
}

export function createFormatPlural(
  getPluralRules: Formatters['getPluralRules'],
  locale: Locale,
): FormatPlural {
  return (value, options) => getPluralRules(locale, options).select(value)
}
