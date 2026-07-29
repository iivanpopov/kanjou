rich text
cli + extract
namespacing

## Configuration

### `kanjou.config.ts`

```ts
import { defineConfig } from '@kanjou/config'

export default defineConfig({
  baseLocale: 'en',
  localesDir: './src/locales',
  dts: {
    outDir: './src/generated/kanjou',
    locales: true, // <- by default
    virtual: true, // <- by default
  },
  prettier: {
    singleQuote: true,
    semi: false,
  },
  compile: {
    outDir: './src/locales/compiled', // <- $localesDir/compiled by default
  },
})
```

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { kanjou } from '@kanjou/vite'

export default defineConfig({
  plugins: [kanjou(), react()], // or kanjou(Omit<UserConfig, "compile">)
})
```

## Server Components Usage

### COMPONENTS WIP, RAW API

```tsx
import { createKanjou } from '@kanjou/react/server'

export async function ServerPage() {
  const messages = await fetchMessages('en')
  const kanjou = createKanjou({ locale: 'en', messages })

  return (
    <div>
      <h1>{kanjou.t('welcome', { name: 'User' })}</h1>

      {/* Server components from instance */}
      <kanjou.Number number={1250.5} options={{ style: 'currency', currency: 'USD' }} />
      <kanjou.DateTime dateTime={new Date()} options={{ dateStyle: 'full' }} />
      <kanjou.Duration duration={{ hours: 1, minutes: 30 }} />
      <kanjou.List items={['Alpha', 'Beta', 'Gamma']} />
      <kanjou.RelativeTime value={-2} unit="hour" />
    </div>
  )
}
```

## Client Components Usage

### COMPONENTS WIP, RAW API

```tsx
'use client'

import {
  KanjouProvider,
  useKanjou,
  KanjouNumber,
  KanjouDateTime,
  KanjouDuration,
  KanjouList,
  KanjouRelativeTime,
} from '@kanjou/react'

// App wrapper
export function App({
  messages,
  children,
}: {
  messages: Record<string, any>
  children: React.ReactNode
}) {
  return (
    <KanjouProvider locale="en" messages={messages}>
      {children}
    </KanjouProvider>
  )
}

// Client component hook & component usage
export function UserProfile({ dynamicErrorKey }: { dynamicErrorKey?: string }) {
  const { t, locale, formatNumber } = useKanjou()

  return (
    <div>
      <p>{t('user.greeting', { username: 'Alex' })}</p>

      {/* t.unsafe for dynamic runtime keys (e.g., form validation errors) */}
      {dynamicErrorKey && <span className="error">{t.unsafe(dynamicErrorKey)}</span>}

      {/* Standalone client components */}
      <KanjouNumber number={99.9} options={{ style: 'currency', currency: 'EUR' }} />
      <KanjouDateTime dateTime={new Date()} />
      <KanjouDuration duration={{ minutes: 45 }} />
      <KanjouList items={['React', 'Vite']} />
      <KanjouRelativeTime value={3} unit="day" />
    </div>
  )
}
```

## CLI Commands

```bash
# Pre-compile ICU messages into AST bundles (js/json)
kanjou compile -l ./src/locales -b en -o ./dist/locales -e json

# Generate TypeScript declaration files for autocomplete & types
kanjou generate -l ./src/locales -b en --locales --virtual

# Compare locale files and show missing keys across languages
kanjou compare -l ./src/locales -b en

# Find translation keys used in source code but missing from locale files
kanjou missing -l ./src/locales -b en

# Find unused keys in locale files that are not referenced in source code
kanjou unused -l ./src/locales -b en
```

## Type System & MessageFormat Functions

`kanjou` provides strict TypeScript inference generated from locale files via declaration merging.

### Declaration Merging (`locales.kanjou.d.ts`)

```ts
import '@kanjou/react'

declare module '@kanjou/react' {
  interface Register {
    locale: 'en' | 'es' | 'fr'
    messages: {
      'welcome': { name: string }
      'cart.total': { amount: { __fn: 'currency' } }
    }
    functions: typeof functions
  }
}
```

### Type Coverage

- **Strict Key Autocomplete**: `t('key')` auto-completes validated keys.
- **Inferred Message Values**: `t('welcome', { name: 'Alex' })` enforces required variables.
- **MessageFormat Function Mapping**: MF2 function calls inside messages map to specific input types:

> DEFAULT FUNCTIONS!!!

- `string`: standard string values
- `number`: `Intl.NumberFormatOptions & Intl.PluralRulesOptions`
- `integer`: integer display, grouping, and sign options
- `currency`: currency code (`USD`, `EUR`), display, and sign options
- `percent`: fraction digits, rounding mode, and formatting
- `offset`: numeric offsets with `add` / `subtract`

> custom function

```ts
  `Date: {$date :fmtDate style=cool}`, // fmtDate - function, style - prop
```
