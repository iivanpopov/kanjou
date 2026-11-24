import type { MessageId, MessageValues, Translate } from '@kanjou/core'
import type { ReactNode } from 'react'

import { resolveMessage } from '@kanjou/core'

import type { Components } from './rich'

import { formatRich } from './rich'

export interface ReactTranslate extends Translate {
  rich: FormatRich
}

export interface FormatRichOptions {
  components?: Components | undefined
}

export interface FormatRich {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>, options?: FormatRichOptions): ReactNode
  unsafe: (id?: string, values?: Record<string, any>, options?: FormatRichOptions) => ReactNode
}

export function enrich(t: Translate, components?: Components): ReactTranslate {
  const fallbackForEmpty = (id?: string): ReactNode => {
    const msg = id !== undefined ? resolveMessage(t.messages, id) : undefined
    return msg === undefined || msg === null ? (id ?? null) : null
  }

  const rich: FormatRich = Object.assign(
    <Id extends MessageId>(
      id: Id,
      values?: MessageValues<Id>,
      options?: FormatRichOptions,
    ): ReactNode => {
      const parts = t.parts(id, values)
      if (parts.length === 0) return fallbackForEmpty(id)
      return formatRich(parts, [options?.components, components])
    },
    {
      unsafe: (
        id?: string,
        values?: Record<string, any>,
        options?: FormatRichOptions,
      ): ReactNode => {
        const parts = t.parts.unsafe(id, values)
        if (parts.length === 0) return fallbackForEmpty(id)
        return formatRich(parts, [options?.components, components])
      },
    },
  )

  const wrapped = <Id extends MessageId>(id: Id, values?: MessageValues<Id>): string =>
    t(id, values)
  return Object.assign(wrapped, t, { rich })
}
