import { KanjouError } from '@kanjou/core'

export interface KanjouReactErrorDetails {
  locale?: string | undefined
  availableLocales?: readonly string[] | undefined
}

export class KanjouReactError extends KanjouError {
  readonly locale?: string | undefined
  readonly availableLocales?: readonly string[] | undefined

  constructor(message: string, details?: KanjouReactErrorDetails, options?: ErrorOptions) {
    super(message, options)
    this.name = 'KanjouReactError'
    this.locale = details?.locale
    this.availableLocales = details?.availableLocales
  }
}
