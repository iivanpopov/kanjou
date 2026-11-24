import type { Locale } from '@kanjou/react'

import { cookies } from 'next/headers'

import { createTranslate } from '@/lib/intl'

import App from './app'
import IntlProvider from './intl-provider'

export default async function Page() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) || 'en'

  const t = createTranslate(locale)

  return (
    <IntlProvider locale={locale}>
      <header>
        <p>
          <strong>Server Component: </strong>
          {t('title.main')}
        </p>
      </header>
      <hr />
      <App />
    </IntlProvider>
  )
}
