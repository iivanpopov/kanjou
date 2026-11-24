import { KanjouError } from './kanjou-error'

export class KanjouLoadError extends KanjouError {
  readonly filePath: string

  constructor(message: string, filePath: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'KanjouLoadError'
    this.filePath = filePath
  }
}
