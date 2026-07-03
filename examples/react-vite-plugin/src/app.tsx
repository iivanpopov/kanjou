import { useI18n } from '@kanjou/react'

import type { Locale } from '#/providers/intl-provider'

import { useLocale } from '#/providers/intl-provider'

export function App() {
  const { t } = useI18n()
  const { locale, setLocale } = useLocale()

  return (
    <div>
      <select value={locale} onChange={(e) => setLocale(e.target.value as Locale)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
      {/* fully typesafe translation, try changing 'greet' or 'name' to see ts errors */}
      <p>{t('greet', { name: 'You' })}</p>
    </div>
  )
}
