import { formatDisplayName } from '@kanjou/core'

import { useKanjouContext } from '../context'

type UseFormatDisplayNameReturn = (
  code: string,
  options: Intl.DisplayNamesOptions,
) => string | undefined

export function useFormatDisplayName(): UseFormatDisplayNameReturn {
  const { formatters, locale } = useKanjouContext()

  return (code, options) => formatDisplayName(formatters.getDisplayNames, locale, code, options)
}
