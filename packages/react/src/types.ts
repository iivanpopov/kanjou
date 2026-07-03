export interface Messages {}

export type InternalMessages = keyof Messages extends never ? Record<string, any> : Messages

export type MessageKey = keyof InternalMessages

export type ExtractValues<T extends string> = T extends `${string}{${infer Param}}${infer Rest}`
  ? Param | ExtractValues<Rest>
  : never

export type MessageValues<Key extends MessageKey> = Record<
  ExtractValues<InternalMessages[Key]>,
  string | number
>
