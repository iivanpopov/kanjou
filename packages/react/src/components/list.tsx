import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export type FormattableList = Parameters<Intl.ListFormat['format']>[0]

export interface KanjouListProps {
  options?: Intl.ListFormatOptions
  list: FormattableList
}

export function KanjouList(props: KanjouListProps): ReactNode {
  const kanjou = useKanjou()

  return kanjou.list(props)
}
