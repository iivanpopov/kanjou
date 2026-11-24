# Runtime APIs (`@kanjou/core`, `@kanjou/react`)

## `@kanjou/core`

Use `createTranslate` for framework-agnostic or non-React code:

```ts
import { createTranslate, createTranslateCache } from '@kanjou/core'
import en from 'virtual:kanjou/en'

const t = createTranslate({
  locale: 'en',
  messages: en,
  cache: createTranslateCache(), // optional; defaults to getSharedTranslateCache()
  options: { functions: { ... } }, // optional MessageFormatOptions
})
```

`t` provides:

- `t(id, values?)` — formats message to `string`.
- `t.unsafe(id?, values?)` — formats dynamic/untyped keys to `string`.
- `t.parts(id, values?)` / `t.parts.unsafe(id?, values?)` — returns `MessagePart[]`.
- `Intl` helpers: `t.number`, `t.date`, `t.plural`, `t.list`, `t.relative`, `t.duration`, `t.display`.
- Metadata: `t.locale`, `t.messages`.

## `@kanjou/react` and `@kanjou/react/server`

### Client components

Wrap the tree with `<TranslateProvider>` and read with `useTranslate()`:

```tsx
<TranslateProvider locale="en" messages={en} components={{ b: (props) => <strong {...props} /> }}>
  <App />
</TranslateProvider>
```

- Nested `<TranslateProvider>` inherits `locale`, `options`, `cache`, and shallow-merges `messages`, `functions`, and `components` with the parent provider.
- `t.rich(id, values?, { components }?)` and `t.rich.unsafe(...)` render MF2 `{#tag}...{/tag}` markup using React components (`Fragment` fallback for unregistered tags).

### Server / non-hook usage (`@kanjou/react/server`)

```ts
import { defineTranslate } from '@kanjou/react/server'
import en from 'virtual:kanjou/en'

export const getTranslate = defineTranslate({
  resources: { en },
  components: { ... },
  options: { ... },
})

const t = getTranslate('en')
```

## Functions (`DefaultFunctions` vs `DraftFunctions` / custom)

- **`DefaultFunctions`** (`string`, `number`, `integer`, `offset`): Included automatically in `virtual:kanjou/functions` when referenced by messages.
- **Draft & custom functions** (`currency`, `percent`, `date`, `datetime`, `time`, `unit`, or app-specific functions): Pass them explicitly via `options.functions` (or `TranslateProvider` `functions` prop) and augment `Register['functions']` in `@kanjou/core` / `@kanjou/react` for type-safe `values`.

## Errors (`KanjouError`)

Kanjou surfaces structured `KanjouError` subclasses with contextual metadata (such as `locale`, `messageId`, `filePath`, and `cause`) when configuration loading, message compilation, or runtime translation fails (for example, calling `useTranslate()` outside `<TranslateProvider>`, missing `locale` on a root `<TranslateProvider>`, or missing resources in `defineTranslate`).
