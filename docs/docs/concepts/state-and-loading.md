---
title: State Management & Loading
---

# State Management & Message Loading

Like `react-intl` (`FormatJS`), Kanjou is intentionally **headless and unopinionated** regarding application state, routing, and network transport.

Kanjou does not force a specific data-fetching library, routing structure, or global store upon your application. Instead, it focuses exclusively on what it does best: **MessageFormat 2 evaluation, End-to-End type safety, React component integration, and Intl formatting**.

---

## Separation of Concerns

| Responsibility                      | Handled By                                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| **Locale State**                    | **Your Application** (URL params, cookies, localStorage, React state, Zustand, etc.)     |
| **Message Loading**                 | **Your Application** (Dynamic `import()`, REST API, CDN, Vite virtual modules)           |
| **Locale Switching**                | **Your Application** (Updating the `locale` and `messages` passed to `<KanjouProvider>`) |
| **Message Formatting & Evaluation** | **Kanjou** (`t()`, `rich()`, MF2 compiler, variables, plural rules)                      |
| **Type Safety & Autocompletion**    | **Kanjou** (`@kanjou/cli` declaration merging and build tools)                           |

---

## Why Headless?

Many i18n libraries bundle complex runtime loaders, cookie readers, and implicit global state that make server-side rendering, code-splitting, and custom architectures difficult to control.

By keeping `<KanjouProvider>` a pure, controlled React component:

1. **Zero Black Magic**: You always know exactly which messages are currently loaded and where they came from.
2. **Flexible Loading Strategies**: Load messages on-demand via dynamic imports, embed them during SSR, or fetch them from a remote translation management system (TMS).
3. **Framework Agnostic State**: Works identically whether your locale is stored in Next.js route params (`/en/...`), React state, or a cookie header.

---

## Common Patterns

### 1. Client-Side State with Dynamic Imports

A typical pattern in Single Page Applications (SPAs) is to create a custom provider that manages the active locale and asynchronously loads the corresponding message bundle.

```tsx
// src/providers/IntlProvider.tsx
import type { Locale, Message } from '@kanjou/react'
import type { ReactNode } from 'react'

import { KanjouProvider } from '@kanjou/react'
import { createContext, use, useState, useTransition } from 'react'

interface IntlContextValue {
  locale: Locale
  setLocale: (nextLocale: Locale) => Promise<void>
  isPending: boolean
}

const IntlContext = createContext<IntlContextValue>({} as IntlContextValue)

// Dynamic loader for translation catalogs
async function loadMessages(locale: Locale): Promise<Record<string, Message>> {
  const module = await import(`../locales/${locale}.ts`)
  return module.default
}

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
  const [isPending, startTransition] = useTransition()

  const setLocale = async (nextLocale: Locale) => {
    if (nextLocale === locale) return

    const nextMessages = await loadMessages(nextLocale)
    startTransition(() => {
      setMessages(nextMessages)
      setLocaleState(nextLocale)
    })
  }

  return (
    <IntlContext value={{ locale, setLocale, isPending }}>
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

Now any child component can both translate messages via `useKanjou()` and switch locales via `useIntl()`:

```tsx
// src/components/LocaleSwitcher.tsx
import type { Locale } from '@kanjou/react'
import type { ChangeEvent } from 'react'

import { useKanjou } from '@kanjou/react'
import { useIntl } from '../providers/IntlProvider'

export function LocaleSwitcher() {
  const { locale, setLocale, isPending } = useIntl()
  const { t } = useKanjou()

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    void setLocale(e.target.value as Locale)
  }

  return (
    <div>
      <select value={locale} onChange={handleChange} disabled={isPending}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
      <p>{t('greet', { name: 'Developer' })}</p>
    </div>
  )
}
```

---

### 2. URL-Based Routing (Next.js / React Router)

In route-based setups (such as `app/[locale]/layout.tsx`), the active locale is driven by the URL parameter:

```tsx
// app/[locale]/layout.tsx
import { KanjouProvider } from '@kanjou/react'
import { notFound } from 'next/navigation'

const SUPPORTED_LOCALES = ['en', 'es', 'fr']

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!SUPPORTED_LOCALES.includes(locale)) notFound()

  // Load dictionary on the server per-request
  const messages = await import(`@/locales/${locale}.ts`).then((m) => m.default)

  return (
    <html lang={locale}>
      <body>
        <KanjouProvider locale={locale} messages={messages}>
          {children}
        </KanjouProvider>
      </body>
    </html>
  )
}
```
