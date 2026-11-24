import type { Cache } from './cache'
import type { CompiledIntlOptions, Locale } from './types'

function serializeFlatOptions(options: object): string {
  const keys = Object.keys(options).sort()
  if (keys.length === 0) return ''

  const json = JSON.stringify(options, keys)
  return json === '{}' ? '' : json
}

export function isCompiledIntlOptions<Options>(
  options: Options | CompiledIntlOptions<Options> | undefined,
): options is CompiledIntlOptions<Options> {
  return (
    Array.isArray(options) &&
    options.length === 2 &&
    typeof options[0] === 'object' &&
    options[0] !== null &&
    typeof options[1] === 'string' &&
    options[1] !== ''
  )
}

export function getIntlFormatter<Formatter, Options extends object | undefined>(
  cache: Cache,
  locale: Locale,
  options: Options | CompiledIntlOptions<Options>,
  Formatter: new (locale: Locale, options: Options) => Formatter,
): Formatter {
  let intlOptions: Options
  let serialized: string | undefined
  if (isCompiledIntlOptions(options)) {
    intlOptions = options[0]
    serialized = options[1]
  } else if (Array.isArray(options)) {
    if (typeof options[0] === 'object' && options[0] !== null) {
      intlOptions = options[0] as Options
      serialized = serializeFlatOptions(options[0])
    } else {
      intlOptions = undefined as Options
      serialized = ''
    }
  } else {
    intlOptions = options
    serialized = intlOptions && serializeFlatOptions(intlOptions)
  }
  const key = serialized ? `${locale.length}:${locale}:${serialized}` : locale
  let formatter: Formatter | undefined = cache.get(key)
  if (!formatter) {
    formatter = new Formatter(locale, intlOptions)
    cache.set(key, formatter)
  }
  return formatter
}
