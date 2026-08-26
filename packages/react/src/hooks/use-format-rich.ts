import type { MessageId, MessageValues } from '@kanjou/core'
import type { ElementType, ReactNode } from 'react'

import { useKanjouContext } from '../context'
import { formatRich } from '../formatters/format-rich'
import { useFormatMessageParts } from './use-format-message'

interface UseFormatRichOptions {
  components?: Record<string, ElementType>
}

type UseFormatRichReturn = <Id extends MessageId>(
  id: Id,
  values?: MessageValues<Id>,
  components?: Record<string, ElementType>,
) => ReactNode

export function useFormatRich(options: UseFormatRichOptions): UseFormatRichReturn {
  const context = useKanjouContext()
  const formatParts = useFormatMessageParts()

  return (id, values, components) => {
    const parts = formatParts(id, values)
    return formatRich(parts, components, options.components, context.components)
  }
}
