import type { KanjouCache } from './cache'
import type { KanjouDateTimeProps } from './components/date-time'
import type { KanjouDurationProps } from './components/duration'
import type { KanjouListProps } from './components/list'
import type { KanjouNumberProps } from './components/number'
import type { KanjouRelativeTimeProps } from './components/relative-time'
import type { Locale } from './types'

import { createIntl } from './cache'

export function createFormatters(cache: KanjouCache, locale: Locale) {
  return {
    dateTime: (props: KanjouDateTimeProps): string => {
      const intl = createIntl('dateTime', locale, props.options, cache)

      if (props.format === 'range') return intl.formatRange(props.start, props.end)
      return intl.format(props.dateTime)
    },
    duration: (props: KanjouDurationProps): string => {
      const intl = createIntl('duration', locale, props.options, cache)

      return intl.format(props.duration)
    },
    list: (props: KanjouListProps): string => {
      const intl = createIntl('list', locale, props.options, cache)

      return intl.format(props.list)
    },
    number: (props: KanjouNumberProps): string => {
      const intl = createIntl('number', locale, props.options, cache)

      if (props.format === 'range') return intl.formatRange(props.start, props.end)
      return intl.format(props.number)
    },
    relativeTime: (props: KanjouRelativeTimeProps): string => {
      const intl = createIntl('relativeTime', locale, props.options, cache)

      return intl.format(props.value, props.unit)
    },
  }
}
