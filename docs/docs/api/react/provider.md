---
title: KanjouProvider
---

# KanjouProvider

The `<KanjouProvider>` component wraps your React application and provides the i18n context (messages, locale, options, etc.) to all nested components and hooks.

## Import

```ts
import { KanjouProvider } from '@kanjou/react'
```

## Usage

```tsx
import { KanjouProvider } from '@kanjou/react'
import { App } from './App'
import en from './locales/en.json'

export function Root() {
  return (
    <KanjouProvider locale="en" messages={en}>
      <App />
    </KanjouProvider>
  )
}
```

## Props

| Prop         | Type                                      | Description                                                         |
| ------------ | ----------------------------------------- | ------------------------------------------------------------------- |
| `children`   | `ReactNode`                               | The React children to wrap.                                         |
| `locale`     | `string`                                  | The current locale (e.g. `'en'`, `'fr-CA'`).                        |
| `messages`   | `Record<string, Message>`                 | The dictionary of MessageFormat 2 messages.                         |
| `functions`  | `Functions`                               | Optional custom functions to be used inside your messages.          |
| `components` | `RichComponents`                          | Optional React components to use for rich text formatting globally. |
| `options`    | `Omit<MessageFormatOptions, 'functions'>` | Optional configuration for `MessageFormat`.                         |

:::tip
For full End-to-End type safety, make sure you configure your TypeScript declarations for `@kanjou/react` to pick up your available locales and messages.
:::
