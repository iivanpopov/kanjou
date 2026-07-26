import type { Translate } from './translate'
import type { Functions, Locale, Message, MessageFormatOptions } from './types'

import { createTranslate } from './translate'

export interface CreateKanjouOptions {
  locale: Locale
  messages: Record<string, Message>
  functions?: Functions
  options?: MessageFormatOptions
}

export interface CreateKanjouReturn {
  t: Translate
}

export function createKanjou({
  messages,
  locale,
  functions,
  options,
}: CreateKanjouOptions): CreateKanjouReturn {
  const opts = Object.assign({}, options, { functions })
  const t = createTranslate(messages, locale, opts)

  return { t }
}
