import type { MessageMarkupPart, MessagePart } from 'messageformat'
import type { ReactNode } from 'react'

import { createElement, Fragment } from 'react'

import type { MessageId, MessageValues } from '../types'
import type { FormatMessageParts } from './format-message'

export type RichComponentProps<Props extends Record<string, any> = Record<string, any>> = {
  children?: ReactNode
} & Props

export type RichComponent<Props extends Record<string, any> = Record<string, any>> = (
  props: RichComponentProps<Props>,
) => ReactNode

export interface FormatRich {
  <Id extends MessageId>(
    id: Id,
    values?: MessageValues<Id>,
    components?: Record<string, RichComponent>,
  ): ReactNode
}

function isMarkup(part: MessagePart<string>): part is MessageMarkupPart {
  return part.type === 'markup' && 'kind' in part
}

function toText(part: MessagePart<string>): string {
  if ('value' in part && part.value !== null) return String(part.value as any)
  return ''
}

function toNode(nodes: ReactNode[]): ReactNode {
  if (nodes.length === 0) return null
  if (nodes.length === 1) return nodes[0]
  return createElement(Fragment, null, nodes)
}

export function formatRich(
  parts: MessagePart<string>[],
  index: number,
  nested: boolean,
  components?: Record<string, RichComponent<any>>,
  overrideComponents?: Record<string, RichComponent<any>>,
): [ReactNode[], number] {
  const nodes: ReactNode[] = []

  while (index < parts.length) {
    const part = parts[index]

    if (part.type === 'bidiIsolation') {
      index++
      continue
    }

    if (isMarkup(part)) {
      const { kind, name } = part
      const render = overrideComponents?.[name] ?? components?.[name]

      if (kind === 'close') {
        if (nested) return [nodes, index + 1]
        index++
        continue
      }

      if (kind === 'standalone') {
        nodes.push(render?.(part.options))
        index++
        continue
      }

      const [children, next] = formatRich(parts, index + 1, true, components, overrideComponents)

      const _children = toNode(children)
      nodes.push(render?.({ ...part.options, children: _children }) ?? _children)

      index = next
      continue
    }

    nodes.push(toText(part))
    index++
  }

  return [nodes, index]
}

export function createFormatRich(
  formatMessageParts: FormatMessageParts,
  components?: Record<string, RichComponent<any>>,
): FormatRich {
  return (id, values, overrideComponents) => {
    const parts = formatMessageParts(id, values)
    const [nodes] = formatRich(parts, 0, false, components, overrideComponents)
    return toNode(nodes)
  }
}
