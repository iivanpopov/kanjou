import type { Locale } from '@kanjou/react'

import { createRoot } from 'react-dom/client'

import { App } from '#/app'

import { IntlProvider } from './providers/intl-provider'
import { loader } from './utils/locale'

const locale = (localStorage.getItem('locale') ?? 'en') as Locale
const messages = await loader(locale)

createRoot(document.getElementById('root')!).render(
  <IntlProvider initialLocale={locale} initialMessages={messages}>
    <App />,
  </IntlProvider>,
)
