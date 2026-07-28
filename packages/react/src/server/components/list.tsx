import type { ReactNode } from 'react'

import type { KanjouListProps as ClientProps } from '../../components/list'
import type { FormatList } from '../../functions'

export interface KanjouListProps extends ClientProps {
  formatList: FormatList
}

export function KanjouList(props: KanjouListProps): ReactNode {
  return props.formatList(props.list, props.options)
}
