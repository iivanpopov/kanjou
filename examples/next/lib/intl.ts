import type { Locale, Message } from '@kanjou/react'

import { defineTranslate } from '@kanjou/react/server'

import en from '../generated/en.js'
import uk from '../generated/uk.js'

export const resources: Record<Locale, Record<string, Message>> = {
  en: en as Record<string, Message>,
  uk: uk as Record<string, Message>,
}

export const createTranslate = defineTranslate({
  resources,
  components: {
    strong: 'strong',
  },
})
