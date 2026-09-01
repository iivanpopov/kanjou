import type { MessageId, MessageValues } from '@kanjou/core'

import { formatMessage } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export interface UseFormatMessageReturn {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): string
  unsafe: (id: string, values?: Record<string, any>) => string
}

export function useFormatMessage(): UseFormatMessageReturn {
  const { messages, locale, options } = use(KanjouContext)

  const _formatMessage = <Id extends MessageId>(id: Id, values?: MessageValues<Id>) =>
    formatMessage(locale, messages, id, values, options)
  // oxlint-disable-next-line react/immutability
  _formatMessage.unsafe = (id: string, values?: Record<string, any>) =>
    formatMessage(locale, messages, id, values, options)

  return _formatMessage
}
