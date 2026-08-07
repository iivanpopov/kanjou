---
title: React Example
---

# React Example

This is a complete working example of a typical React setup using Kanjou.

## App.tsx

```tsx
import type { Locale } from '@kanjou/react'
import type { ChangeEvent } from 'react'

import { KanjouRich } from '@kanjou/react'
import { useState } from 'react'

import { useKanjou } from '@kanjou/react'
import { useIntl } from './providers/intl-provider'

export function App() {
  const kanjou = useKanjou()
  const intl = useIntl()
  const [count, setCount] = useState(1)

  const handleDecrement = () => {
    setCount(Math.max(0, count - 1))
  }

  const handleIncrement = () => {
    setCount(count + 1)
  }

  const handleLocaleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    void intl.setLocale(event.target.value as Locale)
  }

  return (
    <div>
      {/* fully typesafe translation, try changing 'greet' or 'name' to see ts errors */}
      <p>{kanjou.t('greet', { name: 'You' })}</p>

      <div>
        <p>{kanjou.t('apples', { count })}</p>
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
        {kanjou.rich('customCard')}
      </div>

      <select value={kanjou.locale} onChange={handleLocaleChange}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </div>
  )
}
```

## Provider Setup

```tsx
import type { Locale, Message, RichComponents } from '@kanjou/react'
import type { ReactNode } from 'react'

import { KanjouProvider } from '@kanjou/react'
import { useState } from 'react'

import { loader } from '#/utils/locale'
import { IntlContext } from './intl-context'

const defaultComponents: RichComponents = {
  b: ({ children, ...props }) => <strong {...props}>{children}</strong>,
  i: ({ children, ...props }) => <em {...props}>{children}</em>,
  link: ({ children, href = 'https://github.com/iivanpopov/kanjou', ...props }) => (
    <a href={href} target="_blank" rel="noreferrer" {...props}>
      {children}
    </a>
  ),
  badge: (props) => (
    <span
      style={{
        padding: '2px 6px',
        borderRadius: '4px',
        background: '#6366f1',
        color: '#ffffff',
        fontSize: '0.75rem',
        fontWeight: 'bold',
      }}
      {...props}
    >
      VIP
    </span>
  ),
  card: ({ children, ...props }) => (
    <div
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        marginTop: '8px',
        backgroundColor: '#f8fafc',
      }}
      {...props}
    >
      {children}
    </div>
  ),
}

export function IntlProvider({
  children,
  initialLocale,
  initialMessages,
  components = defaultComponents,
}: {
  children: ReactNode
  initialLocale: Locale
  initialMessages: Record<string, Message>
  components?: RichComponents
}) {
  const [_locale, _setLocale] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Record<string, Message>>(() => initialMessages)

  const setLocale = async (newLocale: Locale) => {
    const newMessages = await loader(newLocale)
    setMessages(newMessages)
    _setLocale(newLocale)
  }

  return (
    <IntlContext value={{ locale: _locale, setLocale, messages, setMessages }}>
      {/* kanjou provider only needs the current locale and raw messages object */}
      <KanjouProvider locale={_locale} messages={messages} components={components}>
        {children}
      </KanjouProvider>
    </IntlContext>
  )
}
```
