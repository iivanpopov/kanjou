import type { MessageId, MessageValues, MessagePart, InferPartsType } from '@kanjou/core'

import { formatMessage, formatMessageParts } from '@kanjou/core'

import { useKanjouContext } from '../context'

interface UseFormatMessageReturn {
  <Id extends MessageId>(id: Id, values?: MessageValues<Id>): string
  unsafe: (id: string, values?: Record<string, any>) => string
}

export function useFormatMessage(): UseFormatMessageReturn {
  const { formatters, messages, locale, options } = useKanjouContext()

  const _formatMessage = Object.assign(
    <Id extends MessageId>(id: Id, values?: MessageValues<Id>) =>
      formatMessage(formatters.getMessageFormat, messages, locale, id, values, options),
    {
      unsafe: (id: string, values?: Record<string, any>) =>
        formatMessage(formatters.getMessageFormat, messages, locale, id, values, options),
    },
  )

  return _formatMessage
}

type UseFormatMessagePartsReturn = <Id extends MessageId>(
  id: Id,
  values?: MessageValues<Id>,
) => MessagePart<InferPartsType<Id>>[]

export function useFormatMessageParts(): UseFormatMessagePartsReturn {
  const { formatters, messages, locale, options } = useKanjouContext()

  return (id, values) =>
    formatMessageParts(formatters.getMessageFormat, messages, locale, id, values, options)
}
