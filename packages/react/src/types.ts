import type { MessageFormatOptions, Model } from 'messageformat'

export type MessageFormatFunctions<
  MessageType extends string = string,
  PartType extends string = MessageType,
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

export type RegisteredMessageType = Register extends { functions: infer RegisteredFunctions }
  ? InferMessageType<RegisteredFunctions>
  : string

export type RegisteredPartType = Register extends { functions: infer RegisteredFunctions }
  ? InferPartType<RegisteredFunctions>
  : RegisteredMessageType

export type Functions = Register extends { functions: infer RegisteredFunctions }
  ? RegisteredFunctions
  : undefined
export type Locale = Register extends { locale: infer RegisteredLocale } ? RegisteredLocale : string
export type Messages = Register extends { messages: infer RegisteredMessages }
  ? RegisteredMessages
  : Record<string, Record<string, MessageValue>>

export type MessageKey = keyof Messages
export type MessageValues<Key extends MessageKey> = Messages[Key]
