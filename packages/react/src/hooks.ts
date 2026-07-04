import { use } from 'react'

import type { MessageKey, MessageValues, Locale as KanjouLocale } from './types'

import { I18nContext } from './context'
import { translate } from './translate'

export interface UseI18nReturn<Locale> {
  locale: Locale
  t: <Key extends MessageKey>(key: Key, values?: MessageValues<Key>) => string
}

export function useI18n<Locale = KanjouLocale>(): UseI18nReturn<Locale> {
  const context = use(I18nContext)

  const t = <Key extends MessageKey>(key: Key, values?: MessageValues<Key>) =>
    translate(context.messages, key, values)

  return {
    locale: context.locale as Locale,
    t,
  }
}
