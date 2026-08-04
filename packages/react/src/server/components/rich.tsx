import type { ReactNode } from 'react'

import type { KanjouRichProps as ClientProps } from '../../components/rich'
import type { FormatRich } from '../../rich'
import type { MessageKey } from '../../types'

export interface KanjouRichProps<Key extends MessageKey = MessageKey> extends ClientProps<Key> {
  formatRich: FormatRich
}

export function KanjouRich<Key extends MessageKey = MessageKey>(
  props: KanjouRichProps<Key>,
): ReactNode {
  return props.formatRich(props.id, props.values)
}
