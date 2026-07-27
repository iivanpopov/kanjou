import type { ReactNode } from 'react'

import type { KanjouCache } from '../../cache'
import type { KanjouDateTimeProps as BaseKanjouDateTimeProps } from '../../components/date-time'
import type { Locale } from '../../types'

import { createIntl } from '../../cache'

export type { FormattableDateTime } from '../../components/date-time'

export type KanjouDateTimeProps = BaseKanjouDateTimeProps & {
  cache: KanjouCache
  locale: Locale
}

export function KanjouDateTime({
  cache,
  locale,
  options,
  ...props
}: KanjouDateTimeProps): ReactNode {
  const intl = createIntl('dateTime', locale, options, cache)

  if (props.format === 'range') return intl.formatRange(props.start, props.end)
  return intl.format(props.dateTime)
}
