---
title: Components
render_with_liquid: false
---

# Formatting Components

In addition to the `useKanjou` hook, `@kanjou/react` provides specialized components for inline formatting of dates, numbers, relative time, etc. They are simple wrappers around the hooks.

## Import

```ts
import {
  KanjouDateTime,
  KanjouNumber,
  KanjouPlural,
  KanjouList,
  KanjouDuration,
  KanjouRelativeTime,
  KanjouRich,
} from '@kanjou/react'
```

## `KanjouRich`

Embeds a formatted rich text message (rendering React nodes).

### Props

| Prop     | Type                 | Description                         |
| -------- | -------------------- | ----------------------------------- |
| `id`     | `MessageKey`         | The message key.                    |
| `values` | `MessageValues<Key>` | Variables for the message template. |

### Example

```tsx
<KanjouRich id="welcome_message" values={{ name: 'World' }} />
```

## `KanjouDateTime`

Formats a date or timestamp.

### Props

| Prop       | Type                         | Description                  |
| ---------- | ---------------------------- | ---------------------------- |
| `dateTime` | `number \| Date`             | The date to format.          |
| `options`  | `Intl.DateTimeFormatOptions` | Optional formatting options. |

### Example

```tsx
<KanjouDateTime dateTime={Date.now()} options={{ dateStyle: 'long' }} />
```

## `KanjouNumber`

Formats a number.

### Props

| Prop      | Type                       | Description                  |
| --------- | -------------------------- | ---------------------------- |
| `number`  | `number \| bigint`         | The number to format.        |
| `options` | `Intl.NumberFormatOptions` | Optional formatting options. |

### Example

```tsx
<KanjouNumber number={1000000} options={{ style: 'currency', currency: 'USD' }} />
```

## `KanjouPlural`

Returns the plural category (`zero`, `one`, `two`, `few`, `many`, or `other`) for a given value.

### Props

| Prop      | Type                      | Description                  |
| --------- | ------------------------- | ---------------------------- |
| `value`   | `number`                  | The number to evaluate.      |
| `options` | `Intl.PluralRulesOptions` | Optional formatting options. |

### Example

```tsx
<KanjouPlural value={2} options={{ type: 'ordinal' }} />
```

## `KanjouList`

Formats a list of strings into a localized list (e.g., "A, B, and C").

### Props

| Prop      | Type                     | Description                    |
| --------- | ------------------------ | ------------------------------ |
| `list`    | `Iterable<string>`       | The list of strings to format. |
| `options` | `Intl.ListFormatOptions` | Optional formatting options.   |

### Example

```tsx
<KanjouList list={['Apples', 'Oranges', 'Bananas']} options={{ type: 'conjunction' }} />
```

## `KanjouDuration`

Formats a duration object (e.g., hours, minutes, seconds).

### Props

| Prop       | Type                         | Description                                                         |
| ---------- | ---------------------------- | ------------------------------------------------------------------- |
| `duration` | `Duration`                   | An object with duration values (e.g., `{ hours: 2, minutes: 30 }`). |
| `options`  | `Intl.DurationFormatOptions` | Optional formatting options.                                        |

### Example

```tsx
<KanjouDuration duration={{ hours: 1, minutes: 45 }} />
```

## `KanjouRelativeTime`

Formats a relative time string (e.g., "2 days ago", "in 1 year").

### Props

| Prop      | Type                             | Description                              |
| --------- | -------------------------------- | ---------------------------------------- |
| `value`   | `number`                         | The numerical value.                     |
| `unit`    | `Intl.RelativeTimeFormatUnit`    | The time unit (e.g. `'day'`, `'month'`). |
| `options` | `Intl.RelativeTimeFormatOptions` | Optional formatting options.             |

### Example

```tsx
<KanjouRelativeTime value={-2} unit="day" options={{ numeric: 'auto' }} />
```
