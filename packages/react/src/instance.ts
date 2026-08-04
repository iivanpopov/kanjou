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
} from './functions'
import type { FormatRich, RichComponents } from './rich'
import type { MessageFormatOptions, Message, Locale } from './types'

import { createFormatters } from './formatters'
import {
  createFormatDate,
  createFormatDisplayName,
  createFormatList,
  createFormatMessage,
  createFormatNumber,
  createFormatPlural,
  createFormatRelativeTime,
  createFormatTime,
  createFormatDuration,
} from './functions'
import { createFormatRich } from './rich'

export interface KanjouInstance {
  locale: Locale
  t: FormatMessage
  rich: FormatRich
  formatRich: FormatRich
  formatMessage: FormatMessage
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
  components?: RichComponents,
): KanjouInstance {
  const formatters = createFormatters(cache)
  const formatMessage = createFormatMessage(cache.messages, messages, locale, options)
  const formatRich = createFormatRich(cache.messages, messages, locale, options, components)

  return {
    locale,
    formatters,
    t: formatMessage,
    rich: formatRich,
    formatRich,
    formatMessage,
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
