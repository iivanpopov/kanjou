import type { Formatters } from '../formatters'
import type { Locale } from '../types'

export type Duration = Parameters<Intl.DurationFormat['format']>[0]

export interface FormatDuration {
  (duration: Duration, options?: Intl.DurationFormatOptions): string
}

export function formatDuration(
  getDurationFormat: Formatters['getDurationFormat'],
  locale: Locale,
  duration: Duration,
  options?: Intl.DurationFormatOptions,
): string {
  return getDurationFormat(locale, options).format(duration)
}

export function createFormatDuration(
  getDurationFormat: Formatters['getDurationFormat'],
  locale: Locale,
): FormatDuration {
  return (duration, options) => formatDuration(getDurationFormat, locale, duration, options)
}
