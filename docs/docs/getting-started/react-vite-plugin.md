---
title: React + Vite Plugin
---

# React + Vite Plugin

Kanjou offers a Vite plugin (`@kanjou/vite`) that integrates deeply with Vite's build pipeline. It automatically generates types on the fly and provides Hot Module Replacement (HMR) when you edit your translation files.

## 1. Installation

::: code-group

```bash [npm]
npm install @kanjou/react
npm install -D @kanjou/vite
```

```bash [pnpm]
pnpm add @kanjou/react
pnpm add -D @kanjou/vite
```

```bash [yarn]
yarn add @kanjou/react
yarn add -D @kanjou/vite
```

```bash [bun]
bun add @kanjou/react
bun add -D @kanjou/vite
```

:::

## 2. Update Vite Config

Add the Kanjou plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { kanjou } from '@kanjou/vite'

export default defineConfig({
  plugins: [react(), kanjou()],
})
```

:::tip Plugin Order
The order of `react()` and `kanjou()` in the `plugins` array does not matter. The Kanjou plugin operates independently by handling virtual module resolution, watching locale files, and triggering type generation and HMR updates without depending on React code transformation hooks.
:::

## 3. Experience HMR & Auto-Typing

Once the plugin is configured, simply start your Vite dev server:

```bash
npm run dev
```

Any changes made to your `.ts` locale files will automatically:

1. Re-compile the translation functions.
2. Regenerate TypeScript definitions for fully typed `t()` usage.
3. Push updates to the browser via HMR without a full page reload!
