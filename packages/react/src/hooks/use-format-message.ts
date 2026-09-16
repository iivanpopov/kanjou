import type { MessageFormatOptions, MessageId, MessageValues } from '@kanjou/core'

import { formatMessage } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export interface UseFormatMessageReturn {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>, options?: MessageFormatOptions): string
  unsafe: (id: string, values?: Record<string, any>, options?: MessageFormatOptions) => string
}

export function useFormatMessage(): UseFormatMessageReturn {
  const context = use(KanjouContext)

  const _formatMessage = <Id extends MessageId>(
    id: Id,
    values?: MessageValues<Id>,
    options?: MessageFormatOptions,
  ) =>
    formatMessage(context.locale, context.messages, id, values, {
      ...context.options,
      ...options,
    })

  _formatMessage.unsafe = _formatMessage

  return _formatMessage
}
