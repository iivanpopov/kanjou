import type { ReactNode } from 'react'

import type { FormatRelativeTimeOptions } from '../functions'

import { useKanjou } from '../react'

export interface KanjouRelativeTimeProps {
  options: FormatRelativeTimeOptions
  value: number
}

export function KanjouRelativeTime(props: KanjouRelativeTimeProps): ReactNode {
  const { formatRelativeTime } = useKanjou()
  return formatRelativeTime(props.value, props.options)
}
