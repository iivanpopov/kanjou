'use client'

import type { Context, ReactNode } from 'react'

import { createContext, use, useMemo } from 'react'

import type { FormatRich, RichComponent } from './formatters'
import type { MessageId, MessageValues } from './types'

import { useKanjou } from './context'
import { createFormatRich } from './formatters'

export type { RichComponent, RichComponentProps, FormatRich } from './formatters'
export { formatRich, createFormatRich } from './formatters'

export interface KanjouRichProps<Id extends MessageId = MessageId> {
  id: Id
  values?: MessageValues<Id>
  components?: Record<string, RichComponent>
}

interface KanjouRichContextValue {
  formatRich: FormatRich
}

export const KanjouRichContext: Context<KanjouRichContextValue> = createContext(
  {} as KanjouRichContextValue,
)

export interface KanjouRichProviderProps {
  children: ReactNode
  components?: Record<string, RichComponent>
}

export function KanjouRichProvider({ children, components }: KanjouRichProviderProps): ReactNode {
  const { formatMessageParts } = useKanjou()

  const contextValue = useMemo(
    () => ({ formatRich: createFormatRich(formatMessageParts, components) }),
    [formatMessageParts],
  )

  return <KanjouRichContext value={contextValue}>{children}</KanjouRichContext>
}

export function KanjouRich<Id extends MessageId>(props: KanjouRichProps<Id>): ReactNode {
  const { formatRich } = use(KanjouRichContext)
  return formatRich(props.id, props.values, props.components)
}
