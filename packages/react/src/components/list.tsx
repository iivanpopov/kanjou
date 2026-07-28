import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export interface KanjouListProps {
  options?: Intl.ListFormatOptions
  list: Iterable<string>
}

export function KanjouList(props: KanjouListProps): ReactNode {
  const { formatList } = useKanjou()
  return formatList(props.list, props.options)
}
