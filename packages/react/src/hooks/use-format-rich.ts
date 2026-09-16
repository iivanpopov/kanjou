import type { MessageFormatOptions, MessageId, MessageValues } from '@kanjou/core'
import type { ReactNode } from 'react'

import { formatMessageParts } from '@kanjou/core'
import { use } from 'react'

import type { Components } from '../rich'

import { KanjouContext } from '../context'
import { formatRich } from '../rich'

export interface FormatRichOptions extends MessageFormatOptions {
  components?: Components
}

export interface UseFormatRichOptions {
  components?: Components
}

export interface UseFormatRichReturn {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>, options?: FormatRichOptions): ReactNode
  unsafe: (id: string, values?: Record<string, any>, options?: FormatRichOptions) => ReactNode
}

export function useFormatRich(options: UseFormatRichOptions = {}): UseFormatRichReturn {
  const context = use(KanjouContext)

  const _formatRich = <Id extends MessageId>(
    id: Id,
    values?: MessageValues<Id>,
    overrideOptions?: FormatRichOptions,
  ) => {
    const parts = formatMessageParts(context.locale, context.messages, id, values, {
      ...context.options,
      ...overrideOptions,
    })
    return formatRich(
      parts,
      overrideOptions?.components,
      options.components,
      overrideOptions?.components,
    )
  }

  _formatRich.unsafe = _formatRich

  return _formatRich
}
