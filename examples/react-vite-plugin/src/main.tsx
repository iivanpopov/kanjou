import type { Locale } from '@kanjou/react'

import { TranslateProvider } from '@kanjou/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './app'

import locales from 'virtual:kanjou/locales'

const locale = (localStorage.getItem('locale') as Locale) || 'en'
const messages = await locales[locale]()

const components = { strong: 'strong' } as const

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TranslateProvider locale={locale} messages={messages} components={components}>
      <App />
    </TranslateProvider>
  </StrictMode>,
)
