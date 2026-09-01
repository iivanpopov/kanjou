import type { ListLike, FormatListOptions } from '@kanjou/core'

import { formatList } from '@kanjou/core'
import { use } from 'react'

import { KanjouContext } from '../context'

export type UseFormatListReturn = (value: ListLike, options?: FormatListOptions) => string

export function useFormatList(): UseFormatListReturn {
  const { locale } = use(KanjouContext)

  return (value, options) => formatList(locale, value, options)
}
