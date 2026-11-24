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

export interface CreateTranslateCacheOptions {
  maxSize?: number | undefined
}

const DEFAULT_CACHE_MAX_SIZE = 500

function createBoundedCache(maxSize: number): Cache {
  const map = new Map<string, any>()
  return {
    get(key: string) {
      const value = map.get(key)
      if (value !== undefined) {
        map.delete(key)
        map.set(key, value)
      }
      return value
    },
    set(key: string, value: any) {
      if (maxSize <= 0) return
      if (map.has(key)) {
        map.delete(key)
      } else if (map.size >= maxSize) {
        const oldest = map.keys().next()
        if (!oldest.done) {
          map.delete(oldest.value)
        }
      }
      map.set(key, value)
    },
  }
}

export function createTranslateCache(options?: CreateTranslateCacheOptions): TranslateCache {
  const maxSize = options?.maxSize ?? DEFAULT_CACHE_MAX_SIZE
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
      return (translate ??= createBoundedCache(maxSize))
    },
    get dateTime(): Cache {
      return (dateTime ??= createBoundedCache(maxSize))
    },
    get number(): Cache {
      return (number ??= createBoundedCache(maxSize))
    },
    get plural(): Cache {
      return (plural ??= createBoundedCache(maxSize))
    },
    get list(): Cache {
      return (list ??= createBoundedCache(maxSize))
    },
    get display(): Cache {
      return (display ??= createBoundedCache(maxSize))
    },
    get relative(): Cache {
      return (relative ??= createBoundedCache(maxSize))
    },
    get duration(): Cache {
      return (duration ??= createBoundedCache(maxSize))
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
