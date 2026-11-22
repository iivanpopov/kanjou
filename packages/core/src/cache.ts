export interface Cache<Key = string, Value = any> {
  get(key: Key): Value | undefined
  set(key: Key, value: Value): void
}

export interface TranslateCache {
  readonly translate: Cache
  readonly dateTime: Cache
  readonly number: Cache
  readonly plural: Cache
  readonly list: Cache
  readonly display: Cache
  readonly relative: Cache
  readonly duration: Cache
  readonly message: Cache<object>
}

export function createTranslateCache(): TranslateCache {
  let translate: Cache | undefined
  let dateTime: Cache | undefined
  let number: Cache | undefined
  let plural: Cache | undefined
  let list: Cache | undefined
  let display: Cache | undefined
  let relative: Cache | undefined
  let duration: Cache | undefined
  let message: Cache<object> | undefined

  return {
    get translate(): Cache {
      return (translate ??= new Map())
    },
    get dateTime(): Cache {
      return (dateTime ??= new Map())
    },
    get number(): Cache {
      return (number ??= new Map())
    },
    get plural(): Cache {
      return (plural ??= new Map())
    },
    get list(): Cache {
      return (list ??= new Map())
    },
    get display(): Cache {
      return (display ??= new Map())
    },
    get relative(): Cache {
      return (relative ??= new Map())
    },
    get duration(): Cache {
      return (duration ??= new Map())
    },
    get message(): Cache<object> {
      return (message ??= new WeakMap())
    },
  }
}

const sharedTranslateCache: TranslateCache = createTranslateCache()

export function getSharedTranslateCache(): TranslateCache {
  return sharedTranslateCache
}
