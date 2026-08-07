---
title: Welcome to Kanjou
---

# Kanjou

A modern React internationalization (i18n) library powered by [MessageFormat 2](https://unicode.org/messages/) with End-to-End type safety.

## Key Features

- **End-to-End Type Safety**: Your translations are fully typed. If a message key or argument is wrong, TypeScript will let you know!
- **MessageFormat 2 Support**: Next-generation syntax for robust, flexible, and powerful localization out of the box.
- **Rich Text Components**: Easily intermix React components within your translation strings.
- **First-class Vite Support**: Use our official Vite plugin for seamless Hot Module Replacement (HMR) and real-time type generation.

## Quick Start

::: code-group

```bash [npm]
npm install @kanjou/react
```

```bash [pnpm]
pnpm add @kanjou/react
```

:::

```tsx
import { useKanjou } from '@kanjou/react'

export function Greeting() {
  const kanjou = useKanjou()

  // Fully typed!
  // 'greet' must exist, and 'name' is strongly typed.
  return <p>{kanjou.t('greet', { name: 'World' })}</p>
}
```

Check out the [Installation Guide](./getting-started/installation.md) or explore our [Examples](../examples/index.md) to learn more.
