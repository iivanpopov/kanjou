import type { ReactNode } from 'react'

import { useKanjou } from '../context'

export interface KanjouListProps {
  list: Iterable<string>
  options?: Intl.ListFormatOptions
}

export function KanjouList(props: KanjouListProps): ReactNode {
  const { formatList } = useKanjou()
  return formatList(props.list, props.options)
}
