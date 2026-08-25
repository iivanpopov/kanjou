import type { Locale } from '../types'
import type { Formatters } from './index'

export type Duration = Parameters<Intl.DurationFormat['format']>[0]

export interface FormatDuration {
  (duration: Duration, options?: Intl.DurationFormatOptions): string
}

export function createFormatDuration(
  getDurationFormat: Formatters['getDurationFormat'],
  locale: Locale,
): FormatDuration {
  return (duration, options) => getDurationFormat(locale, options).format(duration)
}
