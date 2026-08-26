import type { MessageMarkupPart, MessagePart } from '@kanjou/core'
import type { ElementType, ReactNode } from 'react'

import { createElement, Fragment } from 'react'

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

function consume(
  parts: MessagePart<string>[],
  index: number,
  nested: boolean,
  ...components: (Record<string, ElementType> | undefined)[]
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
      const render = components[0]?.[name] ?? components[1]?.[name] ?? components[2]?.[name]

      if (kind === 'close') {
        if (nested) return [nodes, index + 1]
        index++
        continue
      }

      if (kind === 'standalone') {
        if (render) nodes.push(createElement(render, { ...part.options, key: index }))
        index++
        continue
      }

      const [children, next] = consume(parts, index + 1, true, ...components)

      const _children = toNode(children)
      nodes.push(createElement(render ?? Fragment, { ...part.options, key: index }, _children))

      index = next
      continue
    }

    nodes.push(toText(part))
    index++
  }

  return [nodes, index]
}

export function formatRich(
  parts: MessagePart<string>[],
  ...components: (Record<string, ElementType> | undefined)[]
): ReactNode {
  const [nodes] = consume(parts, 0, false, ...components)
  return toNode(nodes)
}
