export interface Cache<Key = string, Value = any> {
  getOrInsertComputed(key: Key, value: () => Value): Value
}

export interface TranslateCache {
  translate: Cache
  dateTime: Cache
  number: Cache
  plural: Cache
  list: Cache
  display: Cache
  relative: Cache
  duration: Cache
  message: Cache
}

export function createTranslateCache(): TranslateCache {
  return {
    translate: new Map(),
    dateTime: new Map(),
    number: new Map(),
    plural: new Map(),
    list: new Map(),
    display: new Map(),
    relative: new Map(),
    duration: new Map(),
    message: new Map(),
  }
}
