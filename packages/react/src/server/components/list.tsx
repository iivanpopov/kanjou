import type { ReactNode } from 'react'

import type { KanjouCache } from '../../cache'
import type { KanjouListProps as BaseKanjouListProps } from '../../components/list'
import type { Locale } from '../../types'

import { createIntl } from '../../cache'

export type { FormattableList } from '../../components/list'

export interface KanjouListProps extends BaseKanjouListProps {
  cache: KanjouCache
  locale: Locale
}

export function KanjouList({ cache, locale, options, list }: KanjouListProps): ReactNode {
  const intl = createIntl('list', locale, options, cache)

  return intl.format(list)
}
