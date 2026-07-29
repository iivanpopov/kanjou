import type { ReactNode } from 'react'

import type { KanjouPluralProps as ClientProps } from '../../components/plural'
import type { FormatPlural } from '../../functions'

export interface KanjouPluralProps extends ClientProps {
  formatPlural: FormatPlural
}

export function KanjouPlural(props: KanjouPluralProps): ReactNode {
  return props.formatPlural(props.value, props.options)
}
