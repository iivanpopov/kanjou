import type { MessageId, MessageValues, Translate } from '@kanjou/core'
import type { ReactNode } from 'react'

import type { Components } from './rich'

import { formatRich } from './rich'

export interface ReactTranslate extends Translate {
  rich: FormatRich
}

export interface FormatRichOptions {
  components?: Components
}

export interface FormatRich {
  (id: MessageId, values?: MessageValues, options?: FormatRichOptions): ReactNode
  unsafe: (id: string, values?: Record<string, any>, options?: FormatRichOptions) => ReactNode
}

export function enrich(t: Translate, components?: Components): ReactTranslate {
  const rich: FormatRich = (id, values, options) => {
    const parts = t.parts(id, values)
    if (parts.length === 0) return null
    return formatRich(parts, options?.components, components)
  }

  rich.unsafe = (id, values, options) => {
    const parts = t.parts.unsafe(id, values)
    if (parts.length === 0) return null
    return formatRich(parts, options?.components, components)
  }

  return Object.assign(t, { rich })
}
