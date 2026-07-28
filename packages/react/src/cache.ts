import type { MessageFormat } from 'messageformat'

export interface KanjouCache {
  messages: Map<string, MessageFormat>
  displayNames: Map<string, Intl.DisplayNames>
  dateTime: Map<string, Intl.DateTimeFormat>
  duration: Map<string, Intl.DurationFormat>
  list: Map<string, Intl.ListFormat>
  number: Map<string, Intl.NumberFormat>
  relativeTime: Map<string, Intl.RelativeTimeFormat>
}

export function createCache(): KanjouCache {
  return {
    messages: new Map(),
    displayNames: new Map(),
    dateTime: new Map(),
    duration: new Map(),
    list: new Map(),
    number: new Map(),
    relativeTime: new Map(),
  }
}
