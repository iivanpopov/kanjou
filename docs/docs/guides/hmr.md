---
title: Hot Module Replacement
---

# Hot Module Replacement (HMR)

Kanjou's Vite plugin (`@kanjou/vite`) comes with native support for Hot Module Replacement. This enables a seamless developer experience where modifying translations instantly updates the UI without a full page reload.

## Setup Requirements

HMR works out of the box when you use `@kanjou/vite`. No additional configuration is required beyond registering the plugin:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { kanjou } from '@kanjou/vite'

export default defineConfig({
  plugins: [kanjou()],
})
```

## How it Works

When you modify any locale file (`.ts`, `.js`, `.json`, etc.) inside your configured `localesDir`:

1. The Kanjou Vite plugin detects the file change.
2. If the changed file is your `baseLocale`, the plugin immediately re-runs type generation (updating your `.d.ts` files) to reflect any new or modified keys.
3. The plugin identifies the virtual modules (`virtual:kanjou/[locale]` and `virtual:kanjou/locales`) corresponding to the changed file.
4. Vite invalidates only these specific modules in its module graph.
5. Your application fetches the updated translations and re-renders the affected components instantly.
