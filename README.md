<div align="center">
  <img src="https://raw.githubusercontent.com/iivanpopov/kanjou/main/docs/public/logo.svg" alt="Project Logo">
</div>

Internationalization for React powered by [MessageFormat 2](https://messageformat.unicode.org).

> **Kanjou** is not supposed to mean something. Just a _random_ japanese word.

## Quick Start

> Kanjou precompiles translations at build time via `@kanjou/plugin` or `@kanjou/cli` and does not parse MessageFormat 2 strings at runtime.

Install `@kanjou/react` and `@kanjou/plugin`:

```bash
pnpm add @kanjou/react
pnpm add -D @kanjou/plugin
```

Create `kanjou.config.json` in your project root:

```json
{
  "baseLocale": "en",
  "localesDir": "./src/locales"
}
```

Define your translations using [MF2 syntax](https://messageformat.unicode.org):

```ts
// src/locales/en.ts
export default {
  apples: `
    .input {$count :number}
    .match $count
    one  {{You have {$count} apple.}}
    *    {{You have {$count} apples.}}`,
} as const
```

Register `@kanjou/plugin/vite` (or `@kanjou/plugin/webpack`):

```ts
// vite.config.ts
import kanjou from '@kanjou/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [kanjou(), react()],
})
```

Import the precompiled locale from `virtual:kanjou/en` and wrap your app with `TranslateProvider`:

```tsx
// src/main.tsx
import { TranslateProvider } from '@kanjou/react'
import { createRoot } from 'react-dom/client'
import en from 'virtual:kanjou/en'

import App from './app'

createRoot(document.getElementById('root')!).render(
  <TranslateProvider locale="en" messages={en}>
    <App />
  </TranslateProvider>,
)
```

Use the `useTranslate` hook:

```tsx
// src/app.tsx
import { useTranslate } from '@kanjou/react'

function App() {
  const t = useTranslate()

  return <p>{t('apples', { count: 3 })}</p>
}
```

## CLI Precompilation Workflow

If you prefer ahead-of-time compilation without a bundler plugin, use `@kanjou/cli`:

```bash
pnpm add -D @kanjou/cli
```

Generate TypeScript declarations (`locales.kanjou.d.ts`) and compile locale modules into `compile.outDir` (default `./generated`):

```bash
pnpm kanjou generate
pnpm kanjou compile
```

Then import the precompiled locale module directly:

```tsx
import { TranslateProvider } from '@kanjou/react'

import en from './generated/en.js'
```

## Agent Skills

Install the `kanjou` and `messageformat-2` agent skills from this repository:

```bash
pnpx skills add iivanpopov/kanjou
```

Or install a specific skill:

```bash
pnpx skills add iivanpopov/kanjou --skill kanjou
pnpx skills add iivanpopov/kanjou --skill messageformat-2
```

## Documentation

The documentation is available [here](https://iivanpopov.github.io/kanjou).

## License

[ISC](https://github.com/iivanpopov/kanjou/blob/main/LICENSE)

Copyright © 2026-PRESENT [Ivan Popov](https://github.com/iivanpopov)
