import type { ReactNode } from 'react'

import { useKanjou } from '../context'

export interface KanjouPluralProps {
  value: number
  options?: Intl.PluralRulesOptions
}

export function KanjouPlural(props: KanjouPluralProps): ReactNode {
  const { formatPlural } = useKanjou()
  return formatPlural(props.value, props.options)
}
