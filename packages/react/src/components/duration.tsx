import type { ReactNode } from 'react'

import type { FormattableDuration } from '../functions'

import { useKanjou } from '../react'

export interface KanjouDurationProps {
  options?: Intl.DurationFormatOptions
  duration: FormattableDuration
}

export function KanjouDuration(props: KanjouDurationProps): ReactNode {
  const { formatDuration } = useKanjou()
  return formatDuration(props.duration, props.options)
}
