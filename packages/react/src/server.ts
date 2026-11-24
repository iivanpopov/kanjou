import type { Locale, Message, MessageFormatOptions, TranslateCache } from '@kanjou/core'

import { createTranslate, createTranslateCache } from '@kanjou/core'

import type { ReactTranslate } from './enrich'
import type { Components } from './rich'

import { enrich } from './enrich'
import { KanjouReactError } from './errors'

export * from './errors'

export interface ReactDefineTranslateConfig {
  components?: Components | undefined
  resources: Readonly<Record<string, Readonly<Record<string, Message>>>>
  cache?: TranslateCache | undefined
  options?: MessageFormatOptions | undefined
}

export function defineTranslate(
  config: ReactDefineTranslateConfig,
): (locale: Locale) => ReactTranslate {
  const cache = config.cache ?? createTranslateCache()
  const translates = new Map<Locale, ReactTranslate>()

  return (locale: Locale): ReactTranslate => {
    if (!Object.hasOwn(config.resources, locale) || config.resources[locale] === undefined) {
      const availableLocales = Object.keys(config.resources)
      const available = availableLocales.length > 0 ? availableLocales.join(', ') : '(none)'
      throw new KanjouReactError(
        `No resources defined for locale "${locale}". Available locales: ${available}.`,
        { locale, availableLocales },
      )
    }
    const messages = config.resources[locale]

    let translate = translates.get(locale)
    if (!translate) {
      translate = enrich(
        createTranslate({ locale, messages, cache, options: config.options }),
        config.components,
      )
      translates.set(locale, translate)
    }
    return translate
  }
}
