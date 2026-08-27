import type { FormatDisplayNameOptions } from '@kanjou/core'

import { formatDisplayName } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatDisplayNameReturn = (
  code: string,
  options: FormatDisplayNameOptions,
) => string | undefined

export function useFormatDisplayName(): UseFormatDisplayNameReturn {
  const { locale } = use(KanjouContext)

  return (code, options) => formatDisplayName(locale, code, options)
}
