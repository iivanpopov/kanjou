import { KanjouError } from '@kanjou/generator'

export interface KanjouCliErrorContext {
  localesDir?: string | undefined
  tsconfigPath?: string | undefined
}

export class KanjouCliError extends KanjouError {
  readonly localesDir: string | undefined
  readonly tsconfigPath: string | undefined

  constructor(message: string, context: KanjouCliErrorContext = {}, options?: ErrorOptions) {
    super(message, options)
    this.name = 'KanjouCliError'
    this.localesDir = context.localesDir
    this.tsconfigPath = context.tsconfigPath
  }
}
