import type { ReactNode } from 'react'

import type { KanjouNumberProps as ClientProps } from '../../components/number'
import type { FormatNumber } from '../../functions'

export interface KanjouNumberProps extends ClientProps {
  formatNumber: FormatNumber
}

export function KanjouNumber(props: KanjouNumberProps): ReactNode {
  return props.formatNumber(props.number, props.options)
}
