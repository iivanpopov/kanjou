---
title: 'Getting Started'
---

# Getting Started

## Installing

There are 4 available packages: `@kanjou/react`, `@kanjou/vite`, `@kanjou/cli`, `@kanjou/core` and `@kanjou/config`. `@kanjou/core` and `@kanjou/config` are considered as **internal** and you **should not** install it directly.

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

And use the `useFormatMessage` hook:

```tsx [app.tsx]
import { useFormatMessage } from '@kanjou/react'

function App() {
  const t = useFormatMessage()

  return <p>{t('apples', { count: 3 })}</p>
}
```

### Server

Currently for React Server Components you need to create functions. `@kanjou/core` provides formatters which are used in `@kanjou/react`, you are available to use them.

## What's next?

- If you are using Vite, check out the [Vite Plugin](./vite-plugin.md). It provides **virtual modules**[^1] and auto **types generation** with **HMR**.
- Otherwise, you can use the [CLI](./cli.md) to manage translations manually. Feature requests can be submitted through [GitHub Issues](https://github.com/iivanpopov/kanjou/issues).
- Explore documentation forward, specifically [Essentials](./translation.md) to understand the library's fundamentals and features.

[^1]: **Virtual Module** — module that is resolved **dynamically** and actually **does not** exist.
