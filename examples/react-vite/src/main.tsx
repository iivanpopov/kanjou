import { createRoot } from 'react-dom/client'

import type messages from '#/assets/locales/en'

import { App } from '#/app'
import { IntlProvider } from '#/providers/intl-provider'
import { loadLocale } from '#/utils'

// declare messages for typesafe experience. use your source of truth locale here
declare module '@kanjou/react' {
  export interface Messages {
    greet: 'name'
    apples: 'count'
  }
}

const initialLocale = 'en' // load from localStorage or whatever you want
const initialMessages = await loadLocale(initialLocale)

createRoot(document.getElementById('root')!).render(
  <IntlProvider initialLocale={initialLocale} initialMessages={initialMessages}>
    <App />
  </IntlProvider>,
)
