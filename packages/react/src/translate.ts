import type { Messages, Locale, MessageValues } from './types'

export type Translate = <Key extends keyof Messages>(
  key: Key | (string & {}),
  values?: MessageValues<Key>,
) => string

type TranslateKey = string
type Params = Record<string, any>
type TranslateFunction = (params: Params) => string

const pluralRulesCache = new Map<Locale, Intl.PluralRules>()

function interpolate(message: string, params: Params) {
  return message.replace(/{(\w+)}/g, (_, key) =>
    params[key] !== undefined ? params[key] : `{${key}}`,
  )
}

function hasValues(values: unknown): values is Params {
  return !!values && !!Object.keys(values).length
}

export function translate<Key extends keyof Messages>(
  messages: Record<TranslateKey, TranslateFunction | string | Record<Intl.LDMLPluralRule, string>>,
  locale: Locale,
  key: Key,
  values?: MessageValues<Key>,
): string {
  const message = messages[key]
  if (!message) return key

  if (typeof message === 'function' && hasValues(values)) return message(values)

  if (typeof message === 'string') {
    return hasValues(values) ? interpolate(message, values) : message
  }

  if (typeof message === 'object' && hasValues(values)) {
    let rules = pluralRulesCache.get(locale)
    if (!rules) {
      rules = new Intl.PluralRules(locale)
      pluralRulesCache.set(locale, rules)
    }

    const form = rules.select(values.count)
    return interpolate(message[form], values)
  }

  return message as any
}
