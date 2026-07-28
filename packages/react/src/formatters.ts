import type { Factory } from '#/shared/types'

import { memoize } from '#/shared/memoize'

import type { KanjouCache } from './cache'

export interface Formatters {
  getDisplayNames: Factory<typeof Intl.DisplayNames>
  getDateTimeFormat: Factory<typeof Intl.DateTimeFormat>
  getDurationFormat: Factory<typeof Intl.DurationFormat>
  getListFormat: Factory<typeof Intl.ListFormat>
  getNumberFormat: Factory<typeof Intl.NumberFormat>
  getRelativeTimeFormat: Factory<typeof Intl.RelativeTimeFormat>
}

export function createFormatters(cache: KanjouCache): Formatters {
  const getDisplayNames: Factory<typeof Intl.DisplayNames> = memoize(
    (...args) => new Intl.DisplayNames(...args),
    cache.displayNames,
  )
  const getDateTimeFormat: Factory<typeof Intl.DateTimeFormat> = memoize(
    (...args) => new Intl.DateTimeFormat(...args),
    cache.dateTime,
  )
  const getDurationFormat: Factory<typeof Intl.DurationFormat> = memoize(
    (...args) => new Intl.DurationFormat(...args),
    cache.duration,
  )
  const getListFormat: Factory<typeof Intl.ListFormat> = memoize(
    (...args) => new Intl.ListFormat(...args),
    cache.list,
  )
  const getNumberFormat: Factory<typeof Intl.NumberFormat> = memoize(
    (...args) => new Intl.NumberFormat(...args),
    cache.number,
  )
  const getRelativeTimeFormat: Factory<typeof Intl.RelativeTimeFormat> = memoize(
    (...args) => new Intl.RelativeTimeFormat(...args),
    cache.relativeTime,
  )

  return {
    getDisplayNames,
    getDateTimeFormat,
    getDurationFormat,
    getListFormat,
    getNumberFormat,
    getRelativeTimeFormat,
  }
}
