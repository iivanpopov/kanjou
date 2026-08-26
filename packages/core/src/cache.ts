import type { MessageFormat } from 'messageformat'

export interface Cache<Value = any> {
  get(key: string): Value | undefined
  set(key: string, value: Value): void
  getOrInsertComputed(key: string, callback: (key: string) => Value): Value
}

export interface KanjouCache {
  instances: Cache
  message: Cache<MessageFormat>
  displayNames: Cache<Intl.DisplayNames>
  dateTime: Cache<Intl.DateTimeFormat>
  duration: Cache<Intl.DurationFormat>
  list: Cache<Intl.ListFormat>
  number: Cache<Intl.NumberFormat>
  pluralRules: Cache<Intl.PluralRules>
  relativeTime: Cache<Intl.RelativeTimeFormat>
}

export function createCache(): KanjouCache {
  return {
    instances: new Map(),
    message: new Map(),
    displayNames: new Map(),
    dateTime: new Map(),
    duration: new Map(),
    list: new Map(),
    number: new Map(),
    pluralRules: new Map(),
    relativeTime: new Map(),
  }
}
