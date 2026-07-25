import type { Locale, Message } from '@kanjou/react'

import { KanjouProvider } from '@kanjou/react'
import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from '#/app'

import locales from 'virtual:kanjou/locales'

const persist = (locale: Locale) => localStorage.setItem('locale', locale)

const cache = new Map<Locale, Record<string, Message>>()

export async function loader(locale: Locale) {
  if (cache.has(locale)) return cache.get(locale)!

  await new Promise((resolve) => setTimeout(resolve, 1000))
  const messages = await locales[locale]()
  cache.set(locale, messages)

  return messages
}

const locale = (localStorage.getItem('locale') ?? 'en') as Locale
const messages = await loader(locale)

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={'Loading'}>
    <KanjouProvider
      locale={locale}
      loader={loader}
      messages={messages}
      persist={persist}
      onLocaleChange={(locale) => console.log('localeDidChange:', locale)}
    >
      <App />
    </KanjouProvider>
  </Suspense>,
)
