import type { ReactNode } from 'react'

import type { KanjouRelativeTimeProps as ClientProps } from '../../components/relative-time'
import type { FormatRelativeTime } from '../../functions'

export interface KanjouRelativeTimeProps extends ClientProps {
  formatRelativeTime: FormatRelativeTime
}

export function KanjouRelativeTime(props: KanjouRelativeTimeProps): ReactNode {
  return props.formatRelativeTime(props.value, props.options)
}
