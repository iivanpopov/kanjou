import type { ReactNode } from 'react'

import type { KanjouDurationProps as ClientProps } from '../../components/duration'
import type { FormatDuration } from '../../functions'

export interface KanjouDurationProps extends ClientProps {
  formatDuration: FormatDuration
}

export function KanjouDuration(props: KanjouDurationProps): ReactNode {
  return props.formatDuration(props.duration, props.options)
}
