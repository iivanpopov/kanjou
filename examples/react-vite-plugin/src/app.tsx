import type { Locale } from '@kanjou/react'
import type { ChangeEvent } from 'react'

import { KanjouRich } from '@kanjou/react'
import { useState } from 'react'

import { useIntl } from './providers/intl-provider'

export function App() {
  const { t, locale, setLocale, formatRich } = useIntl()
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

      {/* rich text component usage */}
      <div>
        <h3>Rich Component:</h3>
        <p>
          <KanjouRich id="richText" />
        </p>
        {formatRich('customCard')}
      </div>

      <select value={locale} onChange={handleLocaleChange}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  )
}
