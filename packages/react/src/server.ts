import type {
  CreateKanjouFactoryOptions,
  Kanjou,
  Locale,
  MessageId,
  MessageValues,
} from '@kanjou/core'
import type { ElementType, ReactNode } from 'react'

import { createKanjouFactory as _createKanjouFactory } from '@kanjou/core'

import { formatRich } from './formatters/format-rich'

export interface CreateReactKanjouFactoryOptions extends CreateKanjouFactoryOptions {
  components?: Record<string, ElementType>
}

export interface ReactKanjou extends Kanjou {
  formatRich: <Id extends MessageId>(
    id: Id,
    values?: MessageValues<Id>,
    overrideComponents?: Record<string, ElementType>,
  ) => ReactNode
}

export type CreateReactKanjouFactoryReturn = (
  locale: Locale,
  options?: { components?: Record<string, ElementType> },
) => ReactKanjou

export function createKanjouFactory({
  components,
  ...options
}: CreateReactKanjouFactoryOptions): CreateReactKanjouFactoryReturn {
  const createKanjou = _createKanjouFactory(options)

  return (locale, options) => {
    const kanjou = createKanjou(locale)

    return {
      ...kanjou,
      formatRich: <Id extends MessageId>(
        id: Id,
        values?: MessageValues<Id>,
        overrideComponents?: Record<string, ElementType>,
      ) => {
        const parts = kanjou.formatMessageParts(id, values)
        return formatRich(parts, overrideComponents, options?.components, components)
      },
    }
  }
}
