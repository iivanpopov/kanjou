import type { MessageMarkupPart, MessagePart } from 'messageformat'
import type { ReactNode } from 'react'

import { MessageFormat } from 'messageformat'
import { createElement, Fragment } from 'react'

import type { KanjouCache } from './cache'
import type { Locale, Message, MessageFormatOptions, MessageId, MessageValues } from './types'

export type RichComponentProps<Props extends Record<string, any> = Record<string, any>> = {
  children?: ReactNode
} & Props

export type RichComponent<Props extends Record<string, any> = Record<string, any>> = (
  props: RichComponentProps<Props>,
) => ReactNode

export type RichComponents = Record<string, RichComponent<any>>

export interface FormatRich {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): ReactNode
}

type Part = MessagePart<string>

function isMarkup(part: Part): part is MessageMarkupPart {
  return part.type === 'markup' && 'kind' in part
}

function toText(part: Part): string {
  if ('value' in part && part.value !== null) {
    return typeof part.value === 'string' ? part.value : String(part.value as any)
  }
  return ''
}

function toChildren(nodes: ReactNode[]): ReactNode {
  if (nodes.length === 0) return ''
  if (nodes.length === 1) return nodes[0]
  return createElement(Fragment, null, ...nodes)
}

// review ai slop
function formatRich(
  parts: Part[],
  index: number,
  nested: boolean,
  components?: RichComponents,
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

      if (kind === 'close') {
        if (nested) return [nodes, index + 1]
        index++
        continue
      }

      if (kind === 'standalone') {
        const render = components?.[name]
        const props = part.options ? { ...part.options } : {}
        nodes.push(render ? render(props) : null)
        index++
        continue
      }

      const [children, next] = formatRich(parts, index + 1, true, components)
      const render = components?.[name]
      const props = { children: toChildren(children), ...part.options }
      nodes.push(render ? render(props) : toChildren(children))
      index = next
      continue
    }

    nodes.push(toText(part))
    index++
  }

  return [nodes, index]
}

export function createFormatRich(
  cache: KanjouCache['messages'],
  messages: Record<string, Message>,
  locale: Locale,
  options?: MessageFormatOptions,
  components?: RichComponents,
): FormatRich {
  return (id, values) => {
    const message = messages[id]
    if (!message) return id

    const formatter = cache.getOrInsertComputed(
      `${locale}:${id}`,
      () => new MessageFormat(locale, message, options as any),
    )

    const parts = formatter.formatToParts(values)
    const [nodes] = formatRich(parts, 0, false, components)
    return toChildren(nodes)
  }
}
