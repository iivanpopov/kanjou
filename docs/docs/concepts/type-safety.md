---
title: Type Safety
---

# End-to-End Type Safety

One of Kanjou's standout features is its **End-to-End (E2E) Type Safety**. In most i18n libraries, translation keys are weakly typed, and variable arguments are often just `Record<string, any>`, leading to runtime crashes when variables are missing or misnamed.

Kanjou eliminates this entire class of bugs.

## How It Works

1. **Locale Analysis**: You write your translations in your locale files using MessageFormat 2.
2. **Code Generation**: You run the Kanjou CLI (`@kanjou/cli`). The CLI parses your default locale file, extracts all keys, uncovers the expected variables, and identifies formatting functions (like `:number`).
3. **Module Augmentation**: The CLI generates a TypeScript definition file (`kanjou.d.ts`) that augments the global `@kanjou/react` module.
4. **Strict Usage**: Your React components now get full IDE autocompletion for keys and variables.

## The Developer Experience

### Before

```tsx
// ❌ No autocomplete for "greeting.hello"
// ❌ No warning if you misspell "name" or forget it entirely
const message = t('greeting.hello', { nme: 'Alice' })
```

### After

```tsx
import { useKanjou } from '@kanjou/react'

function Welcome() {
  const kanjou = useKanjou()

  // ✅ Full autocomplete for 'greeting.hello'
  // ✅ Type error if `name` is omitted or misnamed
  // ✅ Knows that `count` should be a number based on MF2 `:number` formatting!
  return <h1>{kanjou.t('greeting.hello', { name: 'Alice', count: 5 })}</h1>
}
```

Because Kanjou knows your schema at build-time, your translations and your code are always perfectly in sync.
