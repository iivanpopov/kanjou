import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export interface KanjouNumberProps {
  options?: Intl.NumberFormatOptions
  number: number | bigint
}

export function KanjouNumber(props: KanjouNumberProps): ReactNode {
  const { formatNumber } = useKanjou()
  return formatNumber(props.number, props.options)
}
