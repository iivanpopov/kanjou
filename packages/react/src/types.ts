import type { MessageFormatOptions, Model } from 'messageformat'

export type MessageFormatFunctions<
  MessageType extends string = string,
  PartType extends string = string,
> = MessageFormatOptions<MessageType, PartType>['functions']

export interface Register {}

export type Message = string | Model.Message
export type MessageValue = string | number | Date

export type InferMessageType<Functions> =
  Functions extends NonNullable<MessageFormatFunctions<infer MessageType, any>>
    ? MessageType
    : never

export type InferPartType<Functions> =
  Functions extends NonNullable<MessageFormatFunctions<any, infer PartType>> ? PartType : never

export type DefaultMessageType = Register extends { functions: infer RegisteredFunctions }
  ? InferMessageType<RegisteredFunctions>
  : string

export type DefaultPartType = Register extends { functions: infer RegisteredFunctions }
  ? InferPartType<RegisteredFunctions>
  : DefaultMessageType

export type Functions = Register extends { functions: infer RegisteredFunctions }
  ? RegisteredFunctions
  : undefined
export type Locale = Register extends { locale: infer RegisteredLocale } ? RegisteredLocale : string
export type Messages = Register extends { messages: infer RegisteredMessages }
  ? RegisteredMessages
  : Record<string, Record<string, MessageValue>>

export type MessageKey = keyof Messages
export type MessageValues<Key extends MessageKey> = Messages[Key]

type ExtractParams<S extends string> = S extends `${string}{${infer Param}}${infer Rest}`
  ? Param | ExtractParams<Rest>
  : never

type ResolveMessage<V> = V extends string
  ? [ExtractParams<V>] extends [never]
    ? Record<string, MessageValue>
    : Record<ExtractParams<V>, MessageValue>
  : V extends Record<string, unknown>
    ? ResolveMessage<V[keyof V]>
    : Record<string, MessageValue>

export type InferMessages<T extends Record<string, unknown>> = {
  [K in keyof T]: ResolveMessage<T[K]>
}
