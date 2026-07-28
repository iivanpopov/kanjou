export type AnyFunction = (...args: any[]) => any
export type AnyClass = new (...args: any) => any
export type Factory<Class extends AnyClass> = (
  ...args: ConstructorParameters<Class>
) => InstanceType<Class>
