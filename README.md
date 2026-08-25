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
.match $count
one  {{You have {$count} apple.}}
*    {{You have {$count} apples.}}`,
} as const
```

Wrap your app with `KanjouProvider`.

```tsx
// main.tsx
import { KanjouProvider } from '@kanjou/react'

import en from './locales/en'

createRoot(document.getElementById('root')!).render(
  <KanjouProvider locale="en" messages={en}>
    <App />
  </KanjouProvider>,
)
```

And finally use the `useKanjou` hook:

```tsx
// app.tsx
import { useKanjou } from '@kanjou/react'

function App() {
  const { t } = useKanjou()
  //           ⌄ fully typed key
  return <p>{t('apples', { count: 3 })}</p>
  //                       ^ fully typed values
}
```

## Documentation

The documentation is available [here](https://iivanpopov.github.io/kanjou).

## License

[ISC](https://github.com/iivanpopov/kanjou/blob/main/LICENSE)

Copyright © 2026-PRESENT [Ivan Popov](https://github.com/iivanpopov)
