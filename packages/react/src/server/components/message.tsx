import type { ReactNode } from 'react'

import type { KanjouMessageProps as ClientProps } from '../../components/message'
import type { FormatMessage } from '../../functions'
import type { MessageId } from '../../types'

export interface KanjouMessageProps<Id extends MessageId = MessageId> extends ClientProps<Id> {
  formatMessage: FormatMessage
}

export function KanjouMessage<Id extends MessageId = MessageId>(
  props: KanjouMessageProps<Id>,
): ReactNode {
  return props.formatMessage(props.id, props.values)
}
