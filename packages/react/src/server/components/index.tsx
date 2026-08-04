import type { ReactNode } from 'react'

import type { KanjouDateTimeProps } from '../../components/date-time'
import type { KanjouDurationProps } from '../../components/duration'
import type { KanjouListProps } from '../../components/list'
import type { KanjouNumberProps } from '../../components/number'
import type { KanjouPluralProps } from '../../components/plural'
import type { KanjouRelativeTimeProps } from '../../components/relative-time'
import type { KanjouRichProps } from '../../components/rich'
import type { KanjouInstance } from '../../instance'
import type { MessageKey } from '../../types'

import { KanjouDateTime } from './date-time'
import { KanjouDuration } from './duration'
import { KanjouList } from './list'
import { KanjouNumber } from './number'
import { KanjouPlural } from './plural'
import { KanjouRelativeTime } from './relative-time'
import { KanjouRich } from './rich'

export function createComponents(instance: KanjouInstance) {
  return {
    Number: (props: KanjouNumberProps): ReactNode => (
      <KanjouNumber {...props} formatNumber={instance.formatNumber} />
    ),
    Plural: (props: KanjouPluralProps): ReactNode => (
      <KanjouPlural {...props} formatPlural={instance.formatPlural} />
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
    Rich: <Key extends MessageKey>(props: KanjouRichProps<Key>): ReactNode => (
      <KanjouRich {...props} formatRich={instance.formatRich} />
    ),
  }
}
