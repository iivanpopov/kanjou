---
title: React + Vite Plugin Example
---

# React + Vite Plugin Example

This is a complete working example of a React app using the `@kanjou/vite` plugin for Hot Module Replacement (HMR) and automatic type generation.

## vite.config.ts

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { kanjou } from '@kanjou/vite'

export default defineConfig({
  plugins: [react(), kanjou()],
})
```

With this plugin installed, modifying your `.ts` translation files will automatically update the browser and re-generate TypeScript definitions without a full reload!
