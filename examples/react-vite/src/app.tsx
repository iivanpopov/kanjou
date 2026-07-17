import type { Locale } from '@kanjou/react'
import type { ChangeEvent } from 'react'

import { useState } from 'react'

import { useIntl } from '#/providers/intl-provider'

export function App() {
  const { t, locale, setLocale } = useIntl()
  const [count, setCount] = useState(1)

  const handleDecrement = () => {
    setCount(Math.max(0, count - 1))
  }

  const handleIncrement = () => {
    setCount(count + 1)
  }

  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void setLocale(event.target.value as Locale)
  }

  return (
    <div>
      {/* fully typesafe translation, try changing 'greet' or 'name' to see ts errors */}
      <p>{t('greet', { name: 'You' })}</p>

      <div>
        <p>{t('apples', { count })}</p>
        <div>
          <button onClick={handleDecrement}>-</button>
          <button onClick={handleIncrement}>+</button>
        </div>
      </div>

      <select value={locale} onChange={handleLocaleChange}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  )
}
