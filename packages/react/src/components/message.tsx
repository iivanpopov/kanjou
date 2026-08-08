import type { ReactNode } from 'react'

import type { MessageId, MessageValues } from '../types'

import { useKanjou } from '../react'

export interface KanjouMessageProps<Id extends MessageId = MessageId> {
  id: Id
  values?: MessageValues<Id>
}

export function KanjouMessage<Id extends MessageId>(props: KanjouMessageProps<Id>): ReactNode {
  const { formatMessage } = useKanjou()
  return formatMessage(props.id, props.values)
}
