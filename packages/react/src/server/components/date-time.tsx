import type { ReactNode } from 'react'

import type { KanjouDateTimeProps as ClientProps } from '../../components/date-time'
import type { FormatDate } from '../../functions'

export interface KanjouDateTimeProps extends ClientProps {
  formatDate: FormatDate
}

export function KanjouDateTime(props: KanjouDateTimeProps): ReactNode {
  return props.formatDate(props.dateTime, props.options)
}
