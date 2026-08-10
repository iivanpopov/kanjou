import type { ReactNode } from 'react'

import { useKanjou } from '../context'

export interface KanjouNumberProps {
  number: number | bigint
  options?: Intl.NumberFormatOptions
}

export function KanjouNumber(props: KanjouNumberProps): ReactNode {
  const { formatNumber } = useKanjou()
  return formatNumber(props.number, props.options)
}
