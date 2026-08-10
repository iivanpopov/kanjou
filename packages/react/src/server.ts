import type { ReactNode } from 'react'

import type { KanjouCache } from './cache'
import type { KanjouDateTimeProps } from './components/date-time'
import type { KanjouDurationProps } from './components/duration'
import type { KanjouListProps } from './components/list'
import type { KanjouMessageProps } from './components/message'
import type { KanjouNumberProps } from './components/number'
import type { KanjouPluralProps } from './components/plural'
import type { KanjouRelativeTimeProps } from './components/relative-time'
import type { RichComponent } from './formatters'
import type { KanjouInstance } from './instance'
import type { KanjouRichProps } from './rich'
import type { Functions, Locale, Message, MessageFormatOptions, MessageId } from './types'

import { createCache } from './cache'
import { createFormatRich } from './formatters'
import { createKanjouInstance } from './instance'

export interface DefineKanjouOptions {
  options?: Omit<MessageFormatOptions, 'functions'>
  functions?: Functions
  components?: Record<string, RichComponent<any>>
  cache?: KanjouCache
}

export type CreateKanjouReturn = {
  Rich: <Id extends MessageId>(props: KanjouRichProps<Id>) => ReactNode
  Number: (props: KanjouNumberProps) => ReactNode
  Plural: (props: KanjouPluralProps) => ReactNode
  DateTime: (props: KanjouDateTimeProps) => ReactNode
  Duration: (props: KanjouDurationProps) => ReactNode
  List: (props: KanjouListProps) => ReactNode
  RelativeTime: (props: KanjouRelativeTimeProps) => ReactNode
  Message: <Id extends MessageId>(props: KanjouMessageProps<Id>) => ReactNode
} & KanjouInstance

export type DefineKanjouReturn = (
  locale: Locale,
  messages: Record<string, Message>,
) => CreateKanjouReturn

export function defineKanjou({
  options,
  functions,
  components,
  cache = createCache(),
}: DefineKanjouOptions = {}): DefineKanjouReturn {
  const _options = { ...options, functions }

  return (locale: Locale, messages: Record<string, Message>) =>
    cache.instances.getOrInsertComputed(locale, () => {
      const instance = createKanjouInstance(cache, messages, locale, _options)
      const formatRich = createFormatRich(instance.formatMessageParts, components)

      return {
        ...instance,
        Rich: (props) => formatRich(props.id, props.values, props.components),
        Number: (props) => instance.formatNumber(props.number, props.options),
        Plural: (props) => instance.formatPlural(props.value, props.options),
        DateTime: (props) => instance.formatDate(props.dateTime, props.options),
        Duration: (props) => instance.formatDuration(props.duration, props.options),
        List: (props) => instance.formatList(props.list, props.options),
        RelativeTime: (props) =>
          instance.formatRelativeTime(props.value, props.unit, props.options),
        Message: (props) => instance.formatMessage(props.id, props.values),
      } satisfies CreateKanjouReturn
    }) as CreateKanjouReturn
}

export { createCache } from './cache'
export { createKanjouInstance } from './instance'

export type * from './cache'
export type * from './instance'
export type * from './types'
export type * from './rich'
