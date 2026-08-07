---
title: Installation
---

# Installation

To get started with Kanjou, you'll need to install the core React library. You may also want to install the CLI or Vite plugin depending on your setup.

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

## Configuration

Create a `kanjou.config.ts` file in the root of your project:

```typescript
import { defineConfig } from '@kanjou/config'

export default defineConfig({
  localesDir: './src/locales',
  baseLocale: 'en',
  dts: { outDir: './src/locales/generated' },
})
```

## Locale Files Structure

By default, you create your translation files in a structured way. For example:

```
src/
└── locales/
    ├── en.ts
    ├── es.ts
    └── fr.ts
```

A typical locale file (`src/locales/en.ts`) looks like this:

```typescript
export default {
  greet: `Hello, {$name}!`,
  apples: `
  .input {$count :number}
  .match $count
    1 {{ You have {$count} apple. }}
    * {{ You have {$count} apples. }}`,
  richText: `Welcome to {#b}Kanjou{/b}!`,
} as const
```
