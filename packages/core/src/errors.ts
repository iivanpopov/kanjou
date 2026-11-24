/* oxlint-disable max-classes-per-file */
export class KanjouError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'KanjouError'
  }
}

export class KanjouFormatError extends KanjouError {
  readonly locale: string
  readonly messageId: string

  constructor(
    message: string,
    details: { locale: string; messageId: string },
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'KanjouFormatError'
    this.locale = details.locale
    this.messageId = details.messageId
  }
}
