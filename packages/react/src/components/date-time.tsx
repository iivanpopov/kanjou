import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export interface KanjouDateTimeProps {
  options?: Intl.DateTimeFormatOptions
  dateTime: number | Date
}

export function KanjouDateTime(props: KanjouDateTimeProps): ReactNode {
  const { formatDate } = useKanjou()
  return formatDate(props.dateTime, props.options)
}
