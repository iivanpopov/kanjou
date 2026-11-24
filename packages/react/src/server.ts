import type { Locale } from '@kanjou/core'
import type { TranslateCache } from '@kanjou/core'
import type { MessageFormatOptions } from '@kanjou/core'

import { createTranslateCache } from '@kanjou/core'
import { createTranslate } from '@kanjou/core'

import type { ReactTranslate } from './enrich'
import type { Components } from './rich'

import { enrich } from './enrich'

export interface ReactDefineTranslateConfig {
  components?: Components
  resources: Record<string, Record<string, any>>
  cache?: TranslateCache
  options?: MessageFormatOptions
}

export interface CreateTranslateContext {
  locale: Locale
}

let nextConfigId = 0

export function defineTranslate(
  config: ReactDefineTranslateConfig,
): (locale: Locale) => ReactTranslate {
  const cache = config.cache ?? createTranslateCache()
  const configId = ++nextConfigId

  return (locale: Locale): ReactTranslate => {
    if (!Object.hasOwn(config.resources, locale) || config.resources[locale] === undefined) {
      throw new Error(`No resources defined for locale "${locale}".`)
    }
    const messages = config.resources[locale]

    const cacheKey = `${configId}\0${locale}`
    let translate = cache.translate.get(cacheKey)
    if (!translate) {
      translate = enrich(
        createTranslate({ locale, messages, cache, options: config.options }),
        config.components,
      )
      cache.translate.set(cacheKey, translate)
    }
    return translate
  }
}
