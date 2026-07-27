import type { KanjouCache } from '../cache'
import type { Translate, TranslateParts } from '../translate'
import type { Functions, Locale, Message, MessageFormatOptions } from '../types'

import { createCache } from '../cache'
import { createFormatters } from '../formatters'
import { createTranslateParts, createTranslate } from '../translate'
import { createComponents } from './components'

export interface CreateKanjouOptions {
  locale: Locale
  messages: Record<string, Message>
  functions?: Functions
  options?: Omit<MessageFormatOptions, 'functions'>
  cache?: KanjouCache
}

export interface CreateKanjouReturn
  extends ReturnType<typeof createFormatters>, ReturnType<typeof createComponents> {
  t: Translate
  parts: TranslateParts
}

export function createKanjou(
  { messages, locale, functions, options }: CreateKanjouOptions,
  cache: KanjouCache = createCache(),
): CreateKanjouReturn {
  const _options = { ...options, functions }

  const t = createTranslate(cache, messages, locale, _options)
  const parts = createTranslateParts(cache, messages, locale, _options)
  const formatters = createFormatters(cache, locale)
  const components = createComponents(cache, locale)

  return { t, parts, ...formatters, ...components }
}
