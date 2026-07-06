export type Message = undefined | string | Record<Intl.LDMLPluralRule, string>

export interface Messages {}
export interface Locales {}

export type Locale = keyof Locales extends never ? string : keyof Locales

export type InternalMessages = keyof Messages extends never ? Record<string, undefined> : Messages

export type MessageValues<Key extends keyof InternalMessages> = Record<
  InternalMessages[Key] extends undefined ? never : InternalMessages[Key],
  string | number
>
