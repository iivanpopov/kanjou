import type { Locale } from '@kanjou/react'

import { TranslateProvider } from '@kanjou/react'
import { cookies } from 'next/headers'

import { createTranslate, resources } from '@/lib/intl'

import App from './app'

const components = { strong: 'strong' } as const

export default async function Page() {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) || 'en'

  const t = createTranslate(locale)

  return (
    <TranslateProvider locale={locale} messages={resources[locale]} components={components}>
      <header>
        <p>
          <strong>Server Component: </strong>
          {t('title.main')}
        </p>
      </header>
      <hr />
      <App />
    </TranslateProvider>
  )
}
