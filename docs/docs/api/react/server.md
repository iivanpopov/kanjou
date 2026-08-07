---
title: Server API
---

# Server-Side API

For environments where you want to render components on the server without React context (e.g. Next.js App Router Server Components), you can use `createKanjou` from `@kanjou/react/server`.

## Import

```ts
import { createKanjou } from '@kanjou/react/server'
```

## `createKanjou`

Creates an independent Kanjou instance for formatting on the server.

### Options

| Option       | Type                                      | Description                                      |
| ------------ | ----------------------------------------- | ------------------------------------------------ |
| `locale`     | `string`                                  | The active locale.                               |
| `messages`   | `Record<string, Message>`                 | The dictionary of messages.                      |
| `functions`  | `Functions`                               | Optional custom formatting functions.            |
| `components` | `RichComponents`                          | Optional default React components for rich text. |
| `options`    | `Omit<MessageFormatOptions, 'functions'>` | Optional configuration for `MessageFormat`.      |

### Returns

Returns an object containing:

- All the formatter functions (`t`, `rich`, `formatDate`, etc.) normally returned by `useKanjou`.
- All the React formatter components (`DateTime`, `Rich`, etc.), pre-bound to this specific instance.

### Example

```tsx
import { createKanjou } from '@kanjou/react/server'

export default async function ServerPage() {
  // Obtain locale and messages dynamically per request (e.g., from route params, headers, or cookies)
  const locale = 'en'
  const messages = await fetchMessages(locale)

  const kanjou = createKanjou({
    locale,
    messages,
    components: {
      link: (props) => <a href="/">{props.children}</a>,
    },
  })

  return (
    <main>
      <h1>{kanjou.t('welcome')}</h1>

      <p>{kanjou.rich('read_more')}</p>

      <kanjou.DateTime dateTime={Date.now()} options={{ dateStyle: 'long' }} />
      <kanjou.Rich id="hello" values={{ name: 'Server' }} />
    </main>
  )
}
```

:::info Under the Hood
Server components and formatters created by `createKanjou` use the explicitly provided instance instead of relying on `useKanjou()` and React Context. This makes them fully compatible with Server Components in modern frameworks like Next.js, where React Context isn't available!
:::
