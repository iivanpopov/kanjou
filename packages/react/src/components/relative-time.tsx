import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export type FormattableRelativeTimeValue = Parameters<Intl.RelativeTimeFormat['format']>[0]
export type FormattableRelativeTimeUnit = Parameters<Intl.RelativeTimeFormat['format']>[1]

export interface KanjouRelativeTimeProps {
  options?: Intl.RelativeTimeFormatOptions
  value: FormattableRelativeTimeValue
  unit: FormattableRelativeTimeUnit
}

export function KanjouRelativeTime(props: KanjouRelativeTimeProps): ReactNode {
  const kanjou = useKanjou()

  return kanjou.relativeTime(props)
}
