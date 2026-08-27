import type { AnyClass } from '#/shared/types'

const constructors = new WeakMap<AnyClass, Map<string, any>>()

export function get<Class extends AnyClass>(
  Class: Class,
  ...args: ConstructorParameters<Class>
): InstanceType<Class> {
  const instances = constructors.getOrInsertComputed(Class, () => new Map())
  const key = args.length === 1 && typeof args[0] === 'string' ? args[0] : JSON.stringify(args)
  return instances.getOrInsertComputed(key, () => new Class(...args))
}
