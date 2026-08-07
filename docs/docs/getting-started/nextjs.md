---
title: Next.js
---

# Next.js Integration

Using Kanjou with Next.js (App Router or Pages Router) allows you to deliver localized, type-safe experiences seamlessly.

## 1. Installation

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

Create `kanjou.config.ts`:

```typescript
import { defineConfig } from '@kanjou/config'

export default defineConfig({
  localesDir: './src/locales',
  baseLocale: 'en',
  dts: { outDir: './src/locales/generated' },
})
```

## 3. App Router Setup

For Server Components, you typically fetch or import your messages and compile them on the server. For Client Components, wrap your app with `KanjouProvider` in a root layout or generic client component wrapper.

### Server-side Compilation (Optional)

If you are using RSC (React Server Components), you can use the internal server utilities or simply compile the messages using the CLI (`npx kanjou compile`) and import them securely.

### Root Layout Setup

Wrap your application in `KanjouProvider` directly in `app/layout.tsx`:

```tsx
import { KanjouProvider } from '@kanjou/react'
import enMessages from '../locales/en'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <KanjouProvider locale="en" messages={enMessages}>
          {children}
        </KanjouProvider>
      </body>
    </html>
  )
}
```

## 4. Usage in Components

In your Client Components, use the `useKanjou` hook:

```tsx
'use client'
import { useKanjou } from '@kanjou/react'

export function Greeting() {
  const kanjou = useKanjou()
  return <h1>{kanjou.t('greet', { name: 'Next.js' })}</h1>
}
```
