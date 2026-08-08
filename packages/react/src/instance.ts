import type { KanjouCache } from './cache'
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
import type { FormatRich, RichComponent } from './rich'
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
  components?: Record<string, RichComponent>,
): KanjouInstance {
  const formatters = createFormatters(cache)
  const formatMessage = createFormatMessage(formatters.getMessageFormat, messages, locale, options)
  const formatRich = createFormatRich(
    formatters.getMessageFormat,
    messages,
    locale,
    options,
    components,
  )

  return {
    locale,

    t: formatMessage,
    rich: formatRich,

    formatMessage,
    formatDate: createFormatDate(formatters.getDateTimeFormat, locale),
    formatTime: createFormatTime(formatters.getDateTimeFormat, locale),
    formatNumber: createFormatNumber(formatters.getNumberFormat, locale),
    formatPlural: createFormatPlural(formatters.getPluralRules, locale),
    formatList: createFormatList(formatters.getListFormat, locale),
    formatDisplayName: createFormatDisplayName(formatters.getDisplayNames, locale),
    formatRelativeTime: createFormatRelativeTime(formatters.getRelativeTimeFormat, locale),
    formatDuration: createFormatDuration(formatters.getDurationFormat, locale),
    formatRich,
  }
}
