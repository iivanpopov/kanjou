import { KanjouError } from '@kanjou/generator'

export interface KanjouPluginErrorOptions extends ErrorOptions {
  virtualId?: string | undefined
  searchPaths?: readonly string[] | undefined
}

export class KanjouPluginError extends KanjouError {
  readonly virtualId?: string | undefined
  readonly searchPaths?: readonly string[] | undefined

  constructor(message: string, options?: KanjouPluginErrorOptions) {
    super(message, options)
    this.name = 'KanjouPluginError'
    this.virtualId = options?.virtualId
    this.searchPaths = options?.searchPaths
  }
}
