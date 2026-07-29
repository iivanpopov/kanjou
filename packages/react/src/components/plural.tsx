import type { ReactNode } from 'react'

import { useKanjou } from '../react'

export interface KanjouPluralProps {
  options?: Intl.PluralRulesOptions
  value: number
}

export function KanjouPlural(props: KanjouPluralProps): ReactNode {
  const { formatPlural } = useKanjou()
  return formatPlural(props.value, props.options)
}
