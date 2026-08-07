---
title: React Components in Messages
---

# React Components in Messages

One of the most powerful features of `@kanjou/react` is its ability to embed React components inside MessageFormat 2 templates using MF2 markup tags (`{#tag}...{/tag}`).

Components are registered globally on `KanjouProvider` and applied when `rich()` encounters the corresponding tag in the message.

## Setup

### 1. Define your message

Use MF2 markup syntax in your locale file:

```ts
// locales/en.ts
export default {
  read_more: `Read our {#link}documentation{/link} for more info!`,
  notice: `Please {#bold}pay attention{/bold} to this!`,
} as const
```

### 2. Register components on the Provider

Pass a `components` map to `KanjouProvider`. Each key matches a tag name used in your messages:

```tsx
import { KanjouProvider } from '@kanjou/react'
import en from './locales/en'

const components = {
  bold: (props) => <strong>{props.children}</strong>,
  link: (props) => <a href="/docs">{props.children}</a>,
}

export function App() {
  return (
    <KanjouProvider locale="en" messages={en} components={components}>
      <Main />
    </KanjouProvider>
  )
}
```

### 3. Render with `rich()`

Call `rich()` instead of `t()` for messages that contain markup tags:

```tsx
import { useKanjou } from '@kanjou/react'

export function Notice() {
  const kanjou = useKanjou()

  return <p>{kanjou.rich('notice')}</p>
}
```

:::warning
Components are registered on the **Provider**, not passed per-call into `rich()`. The `rich(key, values)` second argument is for MF2 variable values (like `{$name}`), not for component renderers.
:::

## Standalone Tags

For self-closing tags without children, use `{#tag/}` syntax:

```ts
export default {
  separator: `First {#br/} Second`,
} as const
```

```tsx
const components = {
  br: () => <br />,
}
```
