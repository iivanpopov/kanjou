'use client'

import { useState } from 'react'

import { Locale, useIntl } from '@/src/providers/intl-provider'

export function ClientComponent() {
  const { t, locale, setLocale } = useIntl()
  const [count, setCount] = useState(1)

  const handleLocaleChange = async (newLocale: string) => {
    await setLocale(newLocale as Locale)
  }

  return (
    <div>
      <p>{t('greet', { name: 'Client' })}</p>

      <div>
        <p>{t('apples', { count })}</p>
        <div>
          <button onClick={() => setCount((c) => Math.max(0, c - 1))}>-</button>
          <button onClick={() => setCount((c) => c + 1)}>+</button>
        </div>
      </div>

      <select value={locale} onChange={(event) => handleLocaleChange(event.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  )
}
