---
title: Server-Side Rendering
---

# Server-Side Rendering (SSR)

When working with modern meta-frameworks like Next.js (App Router), Remix, or Astro, you often need to format translations on the server where React Context is not available.

`@kanjou/react/server` provides an independent version of the Kanjou instance that is safe to use in Server Components.

## Using `createKanjou`

Instead of wrapping your app in a `<KanjouProvider>` and calling `useKanjou()`, you directly instantiate your formatters using `createKanjou`.

### Basic Example (Next.js App Router)

```tsx
import { createKanjou } from '@kanjou/react/server'
import en from '@/locales/en.json'

export default async function ServerPage() {
  // In a real app, you would determine the locale dynamically
  // based on the request (e.g. from params or headers)

  const kanjou = createKanjou({
    locale: 'en',
    messages: en,
    components: {
      link: (props) => <a href="/docs">{props.children}</a>,
    },
  })

  return (
    <main>
      {/* Strings */}
      <h1>{kanjou.t('hello_world')}</h1>

      {/* Rich components */}
      <p>{kanjou.rich('read_more')}</p>

      {/* Server-bound components */}
      <kanjou.DateTime dateTime={Date.now()} options={{ dateStyle: 'long' }} />
    </main>
  )
}
```

## Pattern: Shared Dictionary Fetching

A common pattern is to create a utility function that loads your dictionary and returns the initialized Kanjou instance. This keeps your Server Components clean.

```ts
// src/i18n.ts
import { createKanjou } from '@kanjou/react/server'

export async function getI18n(locale: string) {
  // Fetch or import your locale JSON dynamically
  const messages = await import(`./locales/${locale}.json`).then((m) => m.default)

  return createKanjou({
    locale,
    messages,
  })
}
```

Then in your Server Components:

```tsx
// app/[lang]/page.tsx
import { getI18n } from '@/src/i18n'

export default async function Page({ params: { lang } }) {
  const kanjou = await getI18n(lang)

  return <h1>{kanjou.t('title')}</h1>
}
```

:::info Is this cached?
Yes! `createKanjou` utilizes Kanjou's intelligent caching layer to compile MessageFormat 2 templates efficiently, meaning parsing overhead is kept to an absolute minimum even across requests.
:::
