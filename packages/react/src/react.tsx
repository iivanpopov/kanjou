import type { Context, ReactNode } from 'react'

import { createContext, use, useEffect, useRef, useState } from 'react'

import type { Translate } from './translate'
import type { Functions, Locale, Message, MessageFormatOptions } from './types'

import { createTranslate } from './translate'

export type SetLocale = (newLocale: Locale) => void

type MessagesState = Promise<Record<string, Message>> | Record<string, Message>

export interface KanjouContextValue {
  locale: Locale
  functions?: Functions
  options?: Omit<MessageFormatOptions, 'functions'>
  messages: MessagesState
  setLocale: SetLocale
}

export const KanjouContext: Context<KanjouContextValue> = createContext({
  locale: '',
  setLocale: (_newLocale: string) => {},
  messages: {},
})

export interface KanjouProviderProps {
  children: ReactNode
  locale: string
  messages?: Record<string, Message>
  loader?: (locale: Locale) => Promise<Record<string, Message>> | Record<string, Message>
  persist?: (locale: Locale) => Promise<void> | void
  onLocaleChange?: (locale: Locale) => Promise<void> | void
  functions?: Functions
  options?: Omit<MessageFormatOptions, 'functions'>
}

export function KanjouProvider({
  children,
  locale,
  persist,
  onLocaleChange,
  messages,
  loader,
  ...props
}: KanjouProviderProps): ReactNode {
  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const [_locale, _setLocale] = useState<Locale>(locale)
  const [_messages, _setMessages] = useState<MessagesState>(messages ?? {})

  useEffect(() => {
    if (messages || !loader) return
    _setMessages(loader(_locale))
  }, [])

  const setLocale: SetLocale = async (newLocale) => {
    if (_locale === newLocale) return

    if (!loader) {
      _setLocale(newLocale)
      _setMessages(messagesRef.current!)
      await onLocaleChange?.(newLocale)
      await persist?.(newLocale)
      return
    }

    const promise = Promise.resolve(loader(newLocale)).then(async (newMessages) => {
      _setLocale(newLocale)
      await onLocaleChange?.(newLocale)
      await persist?.(newLocale)
      return newMessages ?? messagesRef.current
    })

    _setMessages(promise)
  }

  return (
    <KanjouContext value={{ ...props, locale: _locale, setLocale, messages: _messages }}>
      {children}
    </KanjouContext>
  )
}

export interface UseI18nReturn {
  locale: Locale
  t: Translate
  setLocale: SetLocale
}

export function useI18n(): UseI18nReturn {
  const context = use(KanjouContext)

  const { locale, setLocale, functions, options } = context

  const messages = context.messages instanceof Promise ? use(context.messages) : context.messages

  const opts = Object.assign({}, options, { functions })
  const t = createTranslate(messages, locale, opts)

  return { locale, setLocale, t }
}
