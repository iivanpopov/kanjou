import type { ReactNode } from 'react'

import type { KanjouCache } from '../../cache'
import type { KanjouDateTimeProps } from '../../components/date-time'
import type { KanjouDurationProps } from '../../components/duration'
import type { KanjouListProps } from '../../components/list'
import type { KanjouNumberProps } from '../../components/number'
import type { KanjouRelativeTimeProps } from '../../components/relative-time'
import type { Locale } from '../../types'

import { KanjouDateTime } from './date-time'
import { KanjouDuration } from './duration'
import { KanjouList } from './list'
import { KanjouNumber } from './number'
import { KanjouRelativeTime } from './relative-time'

export function createComponents(cache: KanjouCache, locale: Locale) {
  return {
    Number: (props: KanjouNumberProps): ReactNode => (
      <KanjouNumber cache={cache} locale={locale} {...props} />
    ),
    DateTime: (props: KanjouDateTimeProps): ReactNode => (
      <KanjouDateTime cache={cache} locale={locale} {...props} />
    ),
    Duration: (props: KanjouDurationProps): ReactNode => (
      <KanjouDuration cache={cache} locale={locale} {...props} />
    ),
    List: (props: KanjouListProps): ReactNode => (
      <KanjouList cache={cache} locale={locale} {...props} />
    ),
    RelativeTime: (props: KanjouRelativeTimeProps): ReactNode => (
      <KanjouRelativeTime cache={cache} locale={locale} {...props} />
    ),
  }
}
