---
title: React + Vite
---

# React + Vite

This guide walks you through setting up Kanjou in a standard React project using Vite.

## 1. Installation

Install the Kanjou React library and CLI tool.

::: code-group

```bash [npm]
npm install @kanjou/react
npm install -D @kanjou/cli
```

```bash [pnpm]
pnpm add @kanjou/react
pnpm add -D @kanjou/cli
```

```bash [yarn]
yarn add @kanjou/react
yarn add -D @kanjou/cli
```

```bash [bun]
bun add @kanjou/react
bun add -D @kanjou/cli
```

:::

## 2. Configuration

Create `kanjou.config.ts` in your root folder:

```typescript
import { defineConfig } from '@kanjou/config'

export default defineConfig({
  localesDir: './src/locales',
  baseLocale: 'en',
  dts: { outDir: './src/locales/generated' },
})
```

## 3. Locale Files

Create your message catalogs (e.g. `src/locales/en.ts`):

```typescript
export default {
  greet: `Hello, {$name}!`,
  apples: `
  .input {$count :number}
  .match $count
    1 {{ You have {$count} apple. }}
    * {{ You have {$count} apples. }}`,
} as const
```

## 4. Generate Types

Run the CLI to compile your messages and generate types:

```bash
npx kanjou generate
```

## 5. Setup Provider

Wrap your application in `KanjouProvider` along with your own state management for switching locales:

```tsx
// src/components/IntlProvider.tsx
import type { Locale, Message } from '@kanjou/react'
import type { ReactNode } from 'react'

import { KanjouProvider } from '@kanjou/react'
import { createContext, use, useState } from 'react'

interface IntlContextValue {
  locale: Locale
  setLocale: (locale: Locale) => Promise<void>
}

const IntlContext = createContext<IntlContextValue>({} as IntlContextValue)

export function IntlProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: ReactNode
  initialLocale: Locale
  initialMessages: Record<string, Message>
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [messages, setMessages] = useState<Record<string, Message>>(initialMessages)

  const setLocale = async (newLocale: Locale) => {
    // Dynamically load new locale messages when switched
    const mod = await import(`../locales/${newLocale}.ts`)
    setMessages(mod.default)
    setLocaleState(newLocale)
  }

  return (
    <IntlContext value={{ locale, setLocale }}>
      <KanjouProvider locale={locale} messages={messages}>
        {children}
      </KanjouProvider>
    </IntlContext>
  )
}

export function useIntl() {
  return use(IntlContext)
}
```

## 6. Usage

Use the `useKanjou` hook for translations and your own `useIntl` hook to switch locales:

```tsx
// src/App.tsx
import type { Locale } from '@kanjou/react'
import type { ChangeEvent } from 'react'

import { useKanjou } from '@kanjou/react'
import { useState } from 'react'
import { useIntl } from './components/IntlProvider'

export function App() {
  const { t } = useKanjou()
  const { locale, setLocale } = useIntl()
  const [count, setCount] = useState(1)

  const handleLocaleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    void setLocale(e.target.value as Locale)
  }

  return (
    <div>
      <select value={locale} onChange={handleLocaleChange}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>

      <p>{t('greet', { name: 'World' })}</p>
      <p>{t('apples', { count })}</p>
      <button onClick={() => setCount((c) => c + 1)}>+</button>
    </div>
  )
}
```

Finally, render everything together:

```tsx
// src/main.tsx
import { createRoot } from 'react-dom/client'
import { IntlProvider } from './components/IntlProvider'
import { App } from './App'
import enMessages from './locales/en'

createRoot(document.getElementById('root')!).render(
  <IntlProvider initialLocale="en" initialMessages={enMessages}>
    <App />
  </IntlProvider>,
)
```

:::tip Headless State Architecture
Kanjou does not enforce a specific state or network loader. To learn more about different strategies for loading messages and handling locale state, see the [State Management & Loading](../../docs/concepts/state-and-loading.md) guide.
:::
