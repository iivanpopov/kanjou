---
title: Next.js Example
---

# Next.js Example

This example demonstrates how to integrate Kanjou into a Next.js App Router setup.

## Root Layout (layout.tsx)

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

## Page Component (page.tsx)

```tsx
'use client'

import { useKanjou } from '@kanjou/react'
import { useState } from 'react'

export default function Home() {
  const kanjou = useKanjou()
  const [count, setCount] = useState(1)

  return (
    <main>
      <h1>{kanjou.t('greet', { name: 'Next.js Developer' })}</h1>
      <div>
        <p>{kanjou.t('apples', { count })}</p>
        <button onClick={() => setCount(Math.max(0, count - 1))}>-</button>
        <button onClick={() => setCount(count + 1)}>+</button>
      </div>
    </main>
  )
}
```
