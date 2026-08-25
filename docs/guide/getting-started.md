---
title: 'Getting Started'
---

# Getting Started

## Installing

There are 4 available packages: `@kanjou/react`, `@kanjou/vite`, `@kanjou/cli` and `@kanjou/config`. `@kanjou/config` is considered as **internal** and you **should not** install it directly.

::: code-group

```sh [npm]
npm install @kanjou/react
```

```sh [yarn]
yarn install @kanjou/react
```

```sh [pnpm]
pnpm install @kanjou/react
```

```sh [bun]
bun install @kanjou/react
```

:::

`@kanjou/cli` and `@kanjou/vite` are not required but they do give you **better UX**.

::: code-group

```sh [npm]
npm install -D @kanjou/cli @kanjou/vite
```

```sh [yarn]
yarn install -D @kanjou/cli @kanjou/vite
```

```sh [pnpm]
pnpm install -D @kanjou/cli @kanjou/vite
```

```sh [bun]
bun install -D @kanjou/cli @kanjou/vite
```

:::

## Using

Define messages using [MessageFormat 2 syntax](https://messageformat.unicode.org):

```ts [locales/en.ts]
export default {
  apples: `
.match $count
one  {{You have {$count} apple.}}
*    {{You have {$count} apples.}}`,
} as const
```

### Client

Wrap app with `KanjouProvider`.

```tsx [main.tsx]
import { KanjouProvider } from '@kanjou/react'

import en from '#/locales/en'

createRoot(document.getElementById('root')!).render(
  <KanjouProvider locale="en" messages={en}>
    <App />
  </KanjouProvider>,
)
```

And use the `useKanjou` hook:

```tsx [app.tsx]
import { useKanjou } from '@kanjou/react'

function App() {
  const { t } = useKanjou()

  return <p>{t('apples', { count: 3 })}</p>
}
```

### Server

For RSC, especially for NextJS, use `defineKanjou` from `@kanjou/react/server`.

Pass all your locale messages upfront via the required `messages` option — `defineKanjou` will cache each locale instance on first use so you only need to specify the locale at the call site:

```ts [lib/kanjou.ts]
import { defineKanjou } from '@kanjou/react/server'

import en from '#/locales/en'
import uk from '#/locales/uk'

export const createKanjou = defineKanjou({
  messages: { en, uk },
})
```

```tsx [app/page.tsx]
import { createKanjou } from '#/lib/kanjou'

export default function Page() {
  const { t, Message, Number, DateTime, Duration, List, RelativeTime, Rich } = createKanjou('en')

  return (
    <div>
      <p>{t('apples', { count: 3 })}</p>
      <Message id="apples" values={{ count: 5 }} />
      <Number number={1234567} />
      <DateTime dateTime={new Date()} />
    </div>
  )
}
```

## What's next?

- If you are using Vite, check out the [Vite Plugin](./vite-plugin.md). It provides **virtual modules**[^1] and auto **types generation** with **HMR**.
- Otherwise, you can use the [CLI](./cli.md) to manage translations manually. Feature requests can be submitted through [GitHub Issues](https://github.com/iivanpopov/kanjou/issues).
- Explore documentation forward, specifically [Limitations](./limitations.md) and [Essentials](./translation.md) to understand the library's fundamentals and features.

[^1]: **Virtual Module** — module that is resolved **dynamically** and actually **does not** exist.
