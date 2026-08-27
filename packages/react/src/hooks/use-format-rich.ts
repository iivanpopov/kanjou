import type { MessageId, MessageValues } from '@kanjou/core'
import type { ElementType, ReactNode } from 'react'

import { formatMessageParts } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'
import { formatRich } from '../rich'

export interface UseFormatRichOptions {
  components?: Record<string, ElementType>
}

export type UseFormatRichReturn = <Id extends MessageId>(
  id: Id,
  values?: MessageValues<Id>,
  components?: Record<string, ElementType>,
) => ReactNode

export function useFormatRich(options: UseFormatRichOptions): UseFormatRichReturn {
  const { locale, messages, components } = use(KanjouContext)

  return (id, values, overrideComponents) => {
    const parts = formatMessageParts(locale, messages, id, values)
    return formatRich(parts, overrideComponents, options.components, components)
  }
}
