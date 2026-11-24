import { KanjouError } from './kanjou-error'

export class KanjouConfigError extends KanjouError {
  readonly configPath: string

  constructor(message: string, configPath: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'KanjouConfigError'
    this.configPath = configPath
  }
}
