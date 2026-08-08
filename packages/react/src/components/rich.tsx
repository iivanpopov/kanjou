import type { ReactNode } from 'react'

import type { MessageId, MessageValues } from '../types'

import { useKanjou } from '../react'

export interface KanjouRichProps<Id extends MessageId = MessageId> {
  id: Id
  values?: MessageValues<Id>
}

export function KanjouRich<Id extends MessageId>(props: KanjouRichProps<Id>): ReactNode {
  const { formatRich } = useKanjou()
  return formatRich(props.id, props.values)
}
