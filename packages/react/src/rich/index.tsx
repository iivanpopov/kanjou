'use client'

import type { Context, ReactNode } from 'react'

import { createContext, use, useMemo } from 'react'

import type { MessageId, MessageValues } from '../types'
import type { FormatRich, RichComponent } from './format-rich'

import { useKanjou } from '../react'
import { createFormatRich } from './format-rich'

export const KanjouRichContext: Context<Record<string, RichComponent>> = createContext({})

export interface KanjouRichProviderProps {
  children: ReactNode
  components: Record<string, RichComponent>
}

export function KanjouRichProvider({ children, components }: KanjouRichProviderProps): ReactNode {
  return <KanjouRichContext value={components}>{children}</KanjouRichContext>
}

export function useRich(components?: Record<string, RichComponent>): FormatRich {
  const { formatMessageParts } = useKanjou()
  const contextComponents = use(KanjouRichContext)

  const _components = useMemo(
    () => ({ ...contextComponents, ...components }),
    [contextComponents, components],
  )

  return useMemo(
    () => createFormatRich(formatMessageParts, _components),
    [formatMessageParts, _components],
  )
}

export interface KanjouRichProps<Id extends MessageId = MessageId> {
  id: Id
  values?: MessageValues<Id>
}

export function KanjouRich<Id extends MessageId>({ id, values }: KanjouRichProps<Id>): ReactNode {
  const formatRich = useRich()
  return formatRich(id, values)
}

export * from './format-rich'
