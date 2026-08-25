import type { ReactNode } from 'react'

import { useKanjou } from '../context'

export interface KanjouDateTimeProps {
  dateTime: number | Date
  options?: Intl.DateTimeFormatOptions
}

export function KanjouDateTime(props: KanjouDateTimeProps): ReactNode {
  const { formatDate } = useKanjou()
  return formatDate(props.dateTime, props.options)
}
