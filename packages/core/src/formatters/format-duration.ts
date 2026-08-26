import type { Locale } from '../types'
import type { Formatters } from './index'

export function formatDuration(
  getDurationFormat: Formatters['getDurationFormat'],
  locale: Locale,
  duration: Parameters<Intl.DurationFormat['format']>[0],
  options?: Intl.DurationFormatOptions,
): string {
  return getDurationFormat(locale, options).format(duration)
}
