'use client'

import type { Locale, Message } from '@kanjou/react'
import type { ReactNode } from 'react'

import { TranslateProvider } from '@kanjou/react'

import en from '../generated/en.js'
import uk from '../generated/uk.js'

const resources: Record<Locale, Record<string, Message>> = {
  en: en as Record<string, Message>,
  uk: uk as Record<string, Message>,
}

const components = { strong: 'strong' } as const

export default function IntlProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  return (
    <TranslateProvider locale={locale} messages={resources[locale]} components={components}>
      {children}
    </TranslateProvider>
  )
}
