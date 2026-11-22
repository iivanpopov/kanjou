import type { MessagePart } from '@kanjou/core'
import type { ElementType, ReactNode } from 'react'

import { createElement, Fragment } from 'react'

function toText(part: MessagePart<string>): string {
  if ('parts' in part && Array.isArray(part.parts)) {
    let text = ''
    for (const sub of part.parts) {
      if (sub.value !== null && sub.value !== undefined) text += String(sub.value as any)
    }
    return text
  }

  if ('value' in part && part.value !== null && part.value !== undefined) {
    return String(part.value as any)
  }

  if (part.type === 'fallback' && 'source' in part) return `{${part.source}}`
  return ''
}

function toNode(nodes: ReactNode[]): ReactNode {
  if (nodes.length === 0) return null
  if (nodes.length === 1) return nodes[0]
  return createElement(Fragment, null, nodes)
}

export type Components = Record<string, ElementType>

function findComponent(
  name: string,
  components: (Components | undefined)[],
): ElementType | undefined {
  for (const c of components) if (c && Object.hasOwn(c, name) && c[name]) return c[name]
  return undefined
}

function consume(
  parts: MessagePart<string>[],
  index: number,
  openTag: string | undefined,
  ...components: (Components | undefined)[]
): [ReactNode[], number] {
  const nodes: ReactNode[] = []

  while (index < parts.length) {
    const part = parts[index]

    if (part.type === 'bidiIsolation') {
      index++
      continue
    }

    if (part.type === 'markup' && 'kind' in part) {
      const { kind, name } = part

      if (kind === 'close') {
        if (openTag !== undefined && name === openTag) return [nodes, index + 1]
        index++
        continue
      }

      const render = findComponent(name, components)

      if (kind === 'standalone') {
        if (render) nodes.push(createElement(render, { ...part.options, key: index }))
        index++
        continue
      }

      const [children, next] = consume(parts, index + 1, name, ...components)

      const _children = toNode(children)
      const props = render ? { ...part.options, key: index } : { key: index }
      nodes.push(createElement(render ?? Fragment, props, _children))

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
  ...components: (Components | undefined)[]
): ReactNode {
  const [nodes] = consume(parts, 0, undefined, ...components)
  return toNode(nodes)
}
