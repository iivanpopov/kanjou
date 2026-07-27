import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export type FormattableDateTime = Parameters<Intl.DateTimeFormat['format']>[0]

type BaseProps = {
  options?: Intl.DateTimeFormatOptions
}

type SingleDateTimeProps = BaseProps & {
  format?: 'format'
  dateTime: FormattableDateTime
}

type RangeDateTimeProps = BaseProps & {
  format: 'range'
  start: Parameters<Intl.DateTimeFormat['formatRange']>[0]
  end: Parameters<Intl.DateTimeFormat['formatRange']>[1]
}

export type KanjouDateTimeProps = SingleDateTimeProps | RangeDateTimeProps

export function KanjouDateTime(props: KanjouDateTimeProps): ReactNode {
  const kanjou = useKanjou()

  return kanjou.dateTime(props)
}
