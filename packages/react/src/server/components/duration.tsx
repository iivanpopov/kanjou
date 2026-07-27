import type { ReactNode } from 'react'

import type { KanjouCache } from '../../cache'
import type { KanjouDurationProps as BaseKanjouDurationProps } from '../../components/duration'
import type { Locale } from '../../types'

import { createIntl } from '../../cache'

export type { FormattableDuration } from '../../components/duration'

export interface KanjouDurationProps extends BaseKanjouDurationProps {
  cache: KanjouCache
  locale: Locale
}

export function KanjouDuration({
  cache,
  locale,
  options,
  duration,
}: KanjouDurationProps): ReactNode {
  const intl = createIntl('duration', locale, options, cache)

  return intl.format(duration)
}
