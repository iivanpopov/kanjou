import type { AnyFunction } from './types'

export interface Cache {
  getOrInsertComputed: (key: string, callback: (key: string) => any) => any
}

export function monadic<Return>(fn: (...args: any[]) => Return, cache: Cache, arg: any): Return {
  const key = typeof arg === 'string' ? arg : JSON.stringify(arg)
  return cache.getOrInsertComputed(key, () => fn(arg))
}

export function variadic<Return>(fn: (...args: any[]) => Return, cache: Cache): Return {
  const args = Array.prototype.slice.call(arguments, 2)
  const key = JSON.stringify(args)
  return cache.getOrInsertComputed(key, () => fn.apply(null, args))
}

export function memoize<Factory extends AnyFunction>(factory: Factory, cache: Cache): Factory {
  const method = factory.length > 1 ? variadic : monadic
  return method.bind(null, factory, cache) as Factory
}
