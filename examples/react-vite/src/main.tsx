import { createRoot } from 'react-dom/client'

import { App } from '#/app'
import { IntlProvider } from '#/providers/intl-provider'
import { loadLocale } from '#/utils'

const initialLocale = 'en' // load from localStorage or whatever you want
const initialMessages = await loadLocale(initialLocale)

createRoot(document.getElementById('root')!).render(
  <IntlProvider initialLocale={initialLocale} initialMessages={initialMessages}>
    <App />
  </IntlProvider>,
)
