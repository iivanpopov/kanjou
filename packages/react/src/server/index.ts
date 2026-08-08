import type { KanjouCache } from '../cache'
import type { KanjouInstance } from '../instance'
import type { RichComponent } from '../rich'
import type { Functions, Locale, Message, MessageFormatOptions } from '../types'

import { createCache } from '../cache'
import { createKanjouInstance } from '../instance'
import { createComponents } from './components'

export interface CreateKanjouOptions {
  locale: Locale
  messages: Record<string, Message>
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: Functions
  components?: Record<string, RichComponent>
}

export type CreateKanjouReturn = KanjouInstance & ReturnType<typeof createComponents>

export function createKanjou(
  { messages, locale, functions, components, options }: CreateKanjouOptions,
  cache: KanjouCache = createCache(),
): CreateKanjouReturn {
  return cache.instances.getOrInsertComputed(locale, () => {
    const _options = { ...options, functions }

    const instance = createKanjouInstance(cache, messages, locale, _options, components)
    const _components = createComponents(instance)

    return { ...instance, ..._components } satisfies CreateKanjouReturn
  }) as CreateKanjouReturn
}
