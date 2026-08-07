---
title: useKanjou
---

# useKanjou

The `useKanjou` hook allows you to consume the i18n context provided by `<KanjouProvider>`. It returns a set of functions to format messages, dates, numbers, and more, as well as the current locale.

## Import

```ts
import { useKanjou } from '@kanjou/react'
```

## Returns

`useKanjou` returns a `KanjouInstance` with the following properties:

- `locale` (`string`): The currently active locale.
- `t(id, values?)`: Formats a message as a string. Aliased to `formatMessage`.
- `rich(id, values?)`: Formats a message to a `ReactNode` (supports React components inside messages). Aliased to `formatRich`.
- `formatDate(date, options?)`: Formats a `Date` or timestamp.
- `formatTime(date, options?)`: Formats a `Date` or timestamp using time formatting.
- `formatNumber(number, options?)`: Formats a `number` or `bigint`.
- `formatPlural(value, options?)`: Returns the plural category for a number.
- `formatList(list, options?)`: Formats an iterable list of strings.
- `formatDisplayName(code, options?)`: Formats translations of language, region, or script codes.
- `formatRelativeTime(value, unit, options?)`: Formats a relative time (e.g. "2 days ago").
- `formatDuration(duration, options?)`: Formats a duration object.

## Usage

### Basic Translation

```tsx
import { useKanjou } from '@kanjou/react'

export function MyComponent() {
  const kanjou = useKanjou()

  return (
    <div>
      {/* Type-safe message keys and parameters! */}
      <h1>{kanjou.t('hello_world')}</h1>
      <p>{kanjou.t('welcome', { name: 'Alice' })}</p>
    </div>
  )
}
```

:::info E2E Type Safety
With Kanjou's types configured, the `t()` and `rich()` functions enforce that both the message `id` and the `values` object exactly match what is defined in your MessageFormat 2 dictionaries.
:::

### Rich Text Formatting

Use the `rich` (or `formatRich`) function when you need to embed React components (like links, bold text, etc.) within your translated messages.

```tsx
import { useKanjou } from '@kanjou/react'

export function RichNotice() {
  const kanjou = useKanjou()

  return (
    <p>
      {kanjou.rich('read_more')}
      {/* Note: Components like 'link' and 'bold' must be configured globally in your <KanjouProvider> */}
    </p>
  )
}
```

### Date and Number Formatting

Kanjou provides high-performance, automatically cached wrappers around native `Intl` formatters.

```tsx
import { useKanjou } from '@kanjou/react'

export function Stats() {
  const kanjou = useKanjou()

  return (
    <ul>
      <li>Views: {kanjou.formatNumber(1000000)}</li>
      <li>Last Updated: {kanjou.formatDate(new Date(), { dateStyle: 'short' })}</li>
    </ul>
  )
}
```
