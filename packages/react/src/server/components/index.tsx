import type { ReactNode } from 'react'

import type { KanjouDateTimeProps } from '../../components/date-time'
import type { KanjouDurationProps } from '../../components/duration'
import type { KanjouListProps } from '../../components/list'
import type { KanjouMessageProps } from '../../components/message'
import type { KanjouNumberProps } from '../../components/number'
import type { KanjouPluralProps } from '../../components/plural'
import type { KanjouRelativeTimeProps } from '../../components/relative-time'
import type { KanjouRichProps } from '../../components/rich'
import type { KanjouInstance } from '../../instance'
import type { MessageId } from '../../types'

import { KanjouDateTime } from './date-time'
import { KanjouDuration } from './duration'
import { KanjouList } from './list'
import { KanjouMessage } from './message'
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
      <KanjouList {...props} formatList={instance.formatList} />
    ),
    RelativeTime: (props: KanjouRelativeTimeProps): ReactNode => (
      <KanjouRelativeTime {...props} formatRelativeTime={instance.formatRelativeTime} />
    ),
    Rich: <Id extends MessageId>(props: KanjouRichProps<Id>): ReactNode => (
      <KanjouRich {...props} formatRich={instance.formatRich} />
    ),
    Message: <Id extends MessageId>(props: KanjouMessageProps<Id>): ReactNode => (
      <KanjouMessage {...props} formatMessage={instance.formatMessage} />
    ),
  }
}
