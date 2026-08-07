---
title: Vite Plugin
---

# `@kanjou/vite`

The official Vite plugin for Kanjou.

## Installation

::: code-group

```bash [npm]
npm install -D @kanjou/vite
```

```bash [pnpm]
pnpm add -D @kanjou/vite
```

```bash [yarn]
yarn add -D @kanjou/vite
```

```bash [bun]
bun add -d @kanjou/vite
```

:::

## Setup

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { kanjou } from '@kanjou/vite'

export default defineConfig({
  plugins: [
    kanjou(), // Configuration is automatically loaded from kanjou.config.ts
  ],
})
```

## Features

- **HMR (Hot Module Replacement)**: Edit your locale files (`.ts`, `.js`, `.json`, etc.) and see translations update instantly in the browser.
- **Virtual Modules**: Imports from `virtual:kanjou/*` are resolved to compiled locale data without needing physical files.
- **Auto Type Generation**: Automatically generates `.d.ts` definitions in development when your base locale changes.

:::warning
This plugin is specifically built for Vite. It is not compatible with Webpack, Turbopack, or other bundlers. For non-Vite environments, you must use the CLI to pre-compile your locales.
:::

:::info How it works
The plugin intercepts imports matching `virtual:kanjou/locales` and `virtual:kanjou/[locale]`. When a virtual module is requested, the plugin reads your source locale files (`.ts`, `.js`, `.json`, etc.), compiles them to AST representations in memory, and serves them directly to the client.

For Hot Module Replacement, the plugin listens to changes in your configured `localesDir`. If the base locale is modified, it updates type definitions. It then finds the corresponding virtual modules in the Vite module graph and invalidates them, triggering a seamless HMR update on the client.
:::
