import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export type FormattableDuration = Parameters<Intl.DurationFormat['format']>[0]

export interface KanjouDurationProps {
  options?: Intl.DurationFormatOptions
  duration: FormattableDuration
}

export function KanjouDuration(props: KanjouDurationProps): ReactNode {
  const kanjou = useKanjou()

  return kanjou.duration(props)
}
