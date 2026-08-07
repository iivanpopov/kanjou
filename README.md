# Kanjou

Next-generation i18n for React — powered by [MessageFormat 2](https://github.com/unicode-org/message-format-wg) and E2E type safety.

**[Documentation](https://iivanpopov.github.io/kanjou/)**

## Install

```bash
pnpm add @kanjou/react
pnpm add -D @kanjou/cli
```

## Quick Start

Define your messages using [MF2 syntax](https://github.com/unicode-org/message-format-wg):

```ts
// locales/en.ts
export default {
  greet: `Hello, {$name}!`,
  apples: `
.input {$count :number}
.match $count
one  {{You have {$count} apple.}}
*    {{You have {$count} apples.}}`,
} as const
```

Wrap your app with `KanjouProvider` and use the `useKanjou` hook:

```tsx
import { KanjouProvider, useKanjou } from '@kanjou/react'
import en from './locales/en'

function App() {
  const { t } = useKanjou()
  return <p>{t('apples', { count: 3 })}</p>
  //           ^ fully typed key  ^ typed variables
}

createRoot(document.getElementById('root')!).render(
  <KanjouProvider locale="en" messages={en}>
    <App />
  </KanjouProvider>,
)
```

## Packages

| Package                               | Description                                               |
| ------------------------------------- | --------------------------------------------------------- |
| [`@kanjou/react`](./packages/react)   | Core React provider, hooks, and formatter components      |
| [`@kanjou/cli`](./packages/cli)       | CLI for compiling locales and generating TypeScript types |
| [`@kanjou/vite`](./packages/vite)     | Vite plugin with HMR and virtual locale modules           |
| [`@kanjou/config`](./packages/config) | Config loader for `kanjou.config.ts`                      |

## License

ISC
