import type { KanjouCache } from '../cache'
import type { KanjouInstance } from '../instance'
import type { Functions, Locale, Message, MessageFormatOptions } from '../types'

import { createCache } from '../cache'
import { createKanjouInstance } from '../instance'
import { createComponents } from './components'

export interface CreateKanjouOptions {
  locale: Locale
  messages: Record<string, Message>
  functions?: Functions
  options?: Omit<MessageFormatOptions, 'functions'>
}

export type CreateKanjouReturn = KanjouInstance & ReturnType<typeof createComponents>

export function createKanjou(
  { messages, locale, functions, options }: CreateKanjouOptions,
  cache: KanjouCache = createCache(),
): CreateKanjouReturn {
  const _options = { ...options, functions }

  const instance = createKanjouInstance(cache, messages, locale, _options)
  const components = createComponents(instance)

  return { ...instance, ...components }
}
