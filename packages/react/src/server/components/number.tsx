import type { ReactNode } from 'react'

import type { KanjouCache } from '../../cache'
import type { KanjouNumberProps as BaseKanjouNumberProps } from '../../components/number'
import type { Locale } from '../../types'

import { createIntl } from '../../cache'

export type { FormattableNumber } from '../../components/number'

export type KanjouNumberProps = BaseKanjouNumberProps & {
  cache: KanjouCache
  locale: Locale
}

export function KanjouNumber({ cache, locale, options, ...props }: KanjouNumberProps): ReactNode {
  const intl = createIntl('number', locale, options, cache)

  if (props.format === 'range') return intl.formatRange(props.start, props.end)
  return intl.format(props.number)
}
