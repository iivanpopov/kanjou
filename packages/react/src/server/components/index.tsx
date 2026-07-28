import type { ReactNode } from 'react'

import type { KanjouDateTimeProps } from '../../components/date-time'
import type { KanjouDurationProps } from '../../components/duration'
import type { KanjouListProps } from '../../components/list'
import type { KanjouNumberProps } from '../../components/number'
import type { KanjouRelativeTimeProps } from '../../components/relative-time'
import type { KanjouInstance } from '../../instance'

import { KanjouDateTime } from './date-time'
import { KanjouDuration } from './duration'
import { KanjouList } from './list'
import { KanjouNumber } from './number'
import { KanjouRelativeTime } from './relative-time'

export function createComponents(instance: KanjouInstance) {
  return {
    Number: (props: KanjouNumberProps): ReactNode => (
      <KanjouNumber {...props} formatNumber={instance.formatNumber} />
    ),
    DateTime: (props: KanjouDateTimeProps): ReactNode => (
      <KanjouDateTime {...props} formatDate={instance.formatDate} />
    ),
    Duration: (props: KanjouDurationProps): ReactNode => (
      <KanjouDuration {...props} formatDuration={instance.formatDuration} />
    ),
    List: (props: KanjouListProps): ReactNode => (
      <KanjouList formatList={instance.formatList} {...props} />
    ),
    RelativeTime: (props: KanjouRelativeTimeProps): ReactNode => (
      <KanjouRelativeTime {...props} formatRelativeTime={instance.formatRelativeTime} />
    ),
  }
}
