import { useTranslate } from '@kanjou/react'
import { useState } from 'react'

export default function App() {
  const t = useTranslate()

  const [count, setCount] = useState(0)

  const handleLocaleChange = (nextLocale: string) => {
    localStorage.setItem('locale', nextLocale)
    location.reload()
  }

  return (
    <main>
      <header>
        <h1>{t('title.main')}</h1>
        <label htmlFor="locale-select">{t('input.select-locale')}: </label>
        <select
          id="locale-select"
          value={t.locale}
          onChange={(event) => handleLocaleChange(event.target.value)}
        >
          <option value="en">English</option>
          <option value="uk">Українська</option>
        </select>
      </header>

      <section>
        <h2>{t('text.welcome', { name: 'World' })}</h2>
        <p>{t.rich('text.welcome', { name: 'World' })}</p>
      </section>

      <section>
        <h2>{t('title.counter')}</h2>
        <p>{t('text.apples', { count })}</p>
        <button type="button" onClick={() => setCount((current) => current + 1)}>
          +1
        </button>
        <button type="button" onClick={() => setCount((current) => Math.max(0, current - 1))}>
          -1
        </button>
        <button type="button" onClick={() => setCount(0)}>
          {t('button.reset')}
        </button>
      </section>

      <section>
        <h2>{t('title.statistics')}</h2>
        <p>
          <span>{t('label.price')}: </span>
          <span>
            {t.number(12345.67, {
              style: 'currency',
              currency: t.locale === 'uk' ? 'UAH' : 'USD',
            })}
          </span>
        </p>
        <p>
          <span>{t('label.date')}: </span>
          <span>{t.date(new Date(), { dateStyle: 'full', timeStyle: 'short' })}</span>
        </p>
      </section>
    </main>
  )
}
