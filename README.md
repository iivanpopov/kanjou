<div align="center">
  <img src="https://raw.githubusercontent.com/iivanpopov/kanjou/main/docs/public/logo.svg" alt="Project Logo">
</div>

Internationalization for React powered by [MessageFormat 2](https://messageformat.unicode.org).

> **Kanjou** is not supposed to mean something. Just a _random_ japanese word.

## Quick Start

```bash
pnpm install @kanjou/react
```

Define your translation using [MF2 syntax](https://messageformat.unicode.org):

```ts
// locales/en.ts
export default {
  apples: `
    .input {$count :number}
    .match $count
    one  {{You have {$count} apple.}}
    *    {{You have {$count} apples.}}`,
} as const
```

Wrap your app with `TranslateProvider`:

```tsx
// main.tsx
import { TranslateProvider } from '@kanjou/react'
import { createRoot } from 'react-dom/client'

import App from './app'
import en from './locales/en'

createRoot(document.getElementById('root')!).render(
  <TranslateProvider locale="en" messages={en}>
    <App />
  </TranslateProvider>,
)
```

Use the `useTranslate` hook:

```tsx
// app.tsx
import { useTranslate } from '@kanjou/react'

function App() {
  const t = useTranslate()

  return <p>{t('apples', { count: 3 })}</p>
}
```

## Documentation

The documentation is available [here](https://iivanpopov.github.io/kanjou).

## License

[ISC](https://github.com/iivanpopov/kanjou/blob/main/LICENSE)

Copyright © 2026-PRESENT [Ivan Popov](https://github.com/iivanpopov)
