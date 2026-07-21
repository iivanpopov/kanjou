import type { Locale } from '@kanjou/react'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { KanjouProvider } from '@kanjou/react'
import { cookies } from 'next/headers'

import { loadLocale } from '@/utils'

declare module '@kanjou/react' {
  export interface Register {
    locale: 'en' | 'es' | 'fr'
    messages: Record<string, Record<string, string | number | Date>>
  }
}

export const metadata: Metadata = {
  title: 'Kanjou Next Example',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies()
  const initialLocale = (cookieStore.get('kanjou_locale')?.value ?? 'en') as Locale
  const initialMessages = await loadLocale(initialLocale)

  return (
    <html lang={initialLocale}>
      <body>
        <KanjouProvider locale={initialLocale} messages={initialMessages}>
          {children}
        </KanjouProvider>
      </body>
    </html>
  )
}
