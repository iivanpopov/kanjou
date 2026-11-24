<div align="center">
  <img src="https://raw.githubusercontent.com/iivanpopov/kanjou/main/docs/public/logo.svg" alt="Project Logo">
</div>

Internationalization for React powered by [MessageFormat 2](https://messageformat.unicode.org).

> **Kanjou** is not supposed to mean something. Just a _random_ japanese word.

## Requirements

- **Node.js >= 20** (all `@kanjou/*` packages are **ESM-only**).
- **Precompilation-only**: Kanjou **does not parse MessageFormat 2 strings at runtime**. Messages must be precompiled at build time with `@kanjou/plugin` (`virtual:kanjou/*`) or `@kanjou/cli` (`kanjou compile`). Passing raw MF2 strings directly to `TranslateProvider` or `createTranslate` outputs the unparsed string literal (and runtime parsing is disabled under `@kanjou/plugin`).

Each message is compiled into one of three tiers:

1. **Plain string** (`"Hello"`) — compiled to a JS string literal with zero function or AST overhead.
2. **Template function** (`"Hi, {$name}"`) — compiled to an inline arrow function `(v) => ...` with zero AST or `MessageFormat` runtime overhead.
3. **MF2 AST (`Model.Message`)** (`.input` / `.local` / `.match`, `:function`, markup) — compiled to a serialized AST executed by `MessageFormat` without runtime parsing.

## Quick Start (Bundler Plugin)

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

Add client virtual module types (e.g. `src/vite-env.d.ts`) and enable `skipLibCheck: true` in `tsconfig.json` when using `@kanjou/plugin`:

```ts
/// <reference types="@kanjou/plugin/client" />
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

Install the Kanjou and MessageFormat 2 agent skills from this repository:

```bash
npx skills add iivanpopov/kanjou
```

## Documentation

The documentation is available [here](https://iivanpopov.github.io/kanjou).

## License

[ISC](https://github.com/iivanpopov/kanjou/blob/main/LICENSE)

Copyright © 2026-PRESENT [Ivan Popov](https://github.com/iivanpopov)
