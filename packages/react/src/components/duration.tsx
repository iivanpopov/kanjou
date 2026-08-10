import type { ReactNode } from 'react'

import type { Duration } from '../formatters'

import { useKanjou } from '../context'

export interface KanjouDurationProps {
  duration: Duration
  options?: Intl.DurationFormatOptions
}

export function KanjouDuration(props: KanjouDurationProps): ReactNode {
  const { formatDuration } = useKanjou()
  return formatDuration(props.duration, props.options)
}
