import type { ReactNode } from 'react'

import type { KanjouCache } from '../cache'
import type { KanjouInstance } from '../instance'
import type { FormatRich, RichComponent } from '../rich/format-rich'
import type {
  Functions,
  Locale,
  Message,
  MessageFormatOptions,
  MessageId,
  MessageValues,
} from '../types'

import { createCache } from '../cache'
import { createKanjouInstance } from '../instance'
import { createFormatRich } from '../rich/format-rich'
import { createComponents } from './components'

export type { FormatRich, RichComponent, RichComponentProps } from '../rich/format-rich'

export interface CreateKanjouOptions {
  locale: Locale
  messages: Record<string, Message>
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: Functions
}

export type CreateKanjouReturn = KanjouInstance & ReturnType<typeof createComponents>

export function createKanjou(
  { messages, locale, functions, options }: CreateKanjouOptions,
  cache: KanjouCache = createCache(),
): CreateKanjouReturn {
  return cache.instances.getOrInsertComputed(locale, () => {
    const _options = { ...options, functions }

    const instance = createKanjouInstance(cache, messages, locale, _options)
    const _components = createComponents(instance)

    return { ...instance, ..._components } satisfies CreateKanjouReturn
  }) as CreateKanjouReturn
}

export interface CreateRichReturn {
  formatRich: FormatRich
  Rich: <Id extends MessageId>(props: { id: Id; values?: MessageValues<Id> }) => ReactNode
}

export function createRich(
  instance: KanjouInstance,
  components?: Record<string, RichComponent<any>>,
): CreateRichReturn {
  const formatRich = createFormatRich(instance.formatMessageParts, components)

  return {
    formatRich,
    Rich: ({ id, values }) => formatRich(id, values),
  }
}

export type * from '../types'
