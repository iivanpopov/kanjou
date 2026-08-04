import type { ReactNode } from 'react'

import type { MessageKey, MessageValues } from '../types'

import { useKanjou } from '../react'

export interface KanjouRichProps<Key extends MessageKey = MessageKey> {
  id: Key
  values?: MessageValues<Key>
}

export function KanjouRich<Key extends MessageKey>(props: KanjouRichProps<Key>): ReactNode {
  const { formatRich } = useKanjou()
  return formatRich(props.id, props.values)
}
