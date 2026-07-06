import { createRoot } from 'react-dom/client'

import { App } from '#/app'
import { IntlProvider } from '#/providers/intl-provider'
import { loadLocale } from '#/utils'

// im gonna create cli tool soon for those who cant use vite plugin
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
