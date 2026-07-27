import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export type FormattableNumber = Parameters<Intl.NumberFormat['format']>[0]

type BaseProps = {
  options?: Intl.NumberFormatOptions
}

type SingleNumberProps = BaseProps & {
  format?: 'format'
  number: FormattableNumber
}

type RangeNumberProps = BaseProps & {
  format: 'range'
  start: FormattableNumber
  end: FormattableNumber
}

export type KanjouNumberProps = SingleNumberProps | RangeNumberProps

export function KanjouNumber(props: KanjouNumberProps): ReactNode {
  const kanjou = useKanjou()

  return kanjou.number(props)
}
