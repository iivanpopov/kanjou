import { KanjouError } from './kanjou-error'

export class KanjouMessageError extends KanjouError {
  readonly filePath: string
  readonly messageKey: string

  constructor(message: string, filePath: string, messageKey: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'KanjouMessageError'
    this.filePath = filePath
    this.messageKey = messageKey
  }
}
