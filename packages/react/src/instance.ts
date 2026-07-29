import type { KanjouCache } from './cache'
import type { Formatters } from './formatters'
import type {
  FormatDate,
  FormatDisplayName,
  FormatList,
  FormatNumber,
  FormatPlural,
  FormatRelativeTime,
  FormatTime,
  FormatDuration,
  FormatMessage,
  FormatMessageParts,
} from './functions'
import type { MessageFormatOptions, Message, Locale } from './types'

import { createFormatters } from './formatters'
import {
  createFormatDate,
  createFormatDisplayName,
  createFormatList,
  createFormatMessage,
  createFormatMessageParts,
  createFormatNumber,
  createFormatPlural,
  createFormatRelativeTime,
  createFormatTime,
  createFormatDuration,
} from './functions'

export interface KanjouInstance {
  locale: Locale
  t: FormatMessage
  formatMessage: FormatMessage
  parts: FormatMessageParts
  formatters: Formatters
  formatDate: FormatDate
  formatTime: FormatTime
  formatNumber: FormatNumber
  formatPlural: FormatPlural
  formatList: FormatList
  formatDisplayName: FormatDisplayName
  formatRelativeTime: FormatRelativeTime
  formatDuration: FormatDuration
}

export function createKanjouInstance(
  cache: KanjouCache,
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions,
): KanjouInstance {
  const formatters = createFormatters(cache)
  const formatMessage = createFormatMessage(cache, messages, locale, options)

  return {
    locale,
    formatters,
    formatMessage,
    t: formatMessage,
    parts: createFormatMessageParts(cache, messages, locale, options),
    formatDate: createFormatDate(formatters.getDateTimeFormat, locale),
    formatTime: createFormatTime(formatters.getDateTimeFormat, locale),
    formatNumber: createFormatNumber(formatters.getNumberFormat, locale),
    formatPlural: createFormatPlural(formatters.getPluralRules, locale),
    formatList: createFormatList(formatters.getListFormat, locale),
    formatDisplayName: createFormatDisplayName(formatters.getDisplayNames, locale),
    formatRelativeTime: createFormatRelativeTime(formatters.getRelativeTimeFormat, locale),
    formatDuration: createFormatDuration(formatters.getDurationFormat, locale),
  }
}
