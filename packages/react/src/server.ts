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

export function defineTranslate(
  config: ReactDefineTranslateConfig,
): (locale: Locale) => ReactTranslate {
  const cache = config.cache ?? createTranslateCache()

  return (locale: Locale): ReactTranslate => {
    const messages = config.resources[locale]

    return cache.translate.getOrInsertComputed(locale, () =>
      enrich(
        createTranslate({ locale, messages, cache, options: config.options }),
        config.components,
      ),
    )
  }
}
