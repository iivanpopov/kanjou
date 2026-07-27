import type { ReactNode } from 'react'

import type { KanjouCache } from '../../cache'
import type { KanjouRelativeTimeProps as BaseKanjouRelativeTimeProps } from '../../components/relative-time'
import type { Locale } from '../../types'

import { createIntl } from '../../cache'

export type {
  FormattableRelativeTimeUnit,
  FormattableRelativeTimeValue,
} from '../../components/relative-time'

export interface KanjouRelativeTimeProps extends BaseKanjouRelativeTimeProps {
  cache: KanjouCache
  locale: Locale
}

export function KanjouRelativeTime({
  cache,
  locale,
  options,
  value,
  unit,
}: KanjouRelativeTimeProps): ReactNode {
  const intl = createIntl('relativeTime', locale, options, cache)

  return intl.format(value, unit)
}
