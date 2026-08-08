import type { ReactNode } from 'react'

import type { KanjouRichProps as ClientProps } from '../../components/rich'
import type { FormatRich } from '../../rich'
import type { MessageId } from '../../types'

export interface KanjouRichProps<Id extends MessageId = MessageId> extends ClientProps<Id> {
  formatRich: FormatRich
}

export function KanjouRich<Id extends MessageId = MessageId>(
  props: KanjouRichProps<Id>,
): ReactNode {
  return props.formatRich(props.id, props.values)
}
