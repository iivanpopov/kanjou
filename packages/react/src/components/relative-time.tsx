import type { ReactNode } from 'react'

import type { FormatRelativeTimeOptions } from '../formatters'

import { useKanjou } from '../context'

export interface KanjouRelativeTimeProps {
  value: number
  unit: Intl.RelativeTimeFormatUnit
  options?: FormatRelativeTimeOptions
}

export function KanjouRelativeTime(props: KanjouRelativeTimeProps): ReactNode {
  const { formatRelativeTime } = useKanjou()
  return formatRelativeTime(props.value, props.unit, props.options)
}
