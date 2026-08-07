---
title: Configuration
---

# Configuration (`kanjou.config.ts`)

Kanjou can be configured using a `kanjou.config.ts` (or `.js`, `.mts`, etc.) file in the root of your project.

## `defineConfig`

You can use the `defineConfig` helper to get autocompletion and type checking for your configuration:

```typescript
import { defineConfig } from '@kanjou/config'

export default defineConfig({
  localesDir: './src/locales',
  baseLocale: 'en',
})
```

## Options

### `localesDir`

- **Type:** `string`
- **Description:** The path to the directory containing your source JSON locale files.

### `baseLocale`

- **Type:** `string`
- **Description:** The name of your primary/base locale (e.g. `'en'`). Used as the source of truth for generating types.

### `prettier`

- **Type:** `PrettierOptions`
- **Description:** Prettier formatting options to apply to generated files (like `.d.ts` or compiled `.js`).

### `dts`

- **Type:** `DtsOptions`
- **Description:** Configuration for generated TypeScript definitions.

**`DtsOptions` properties:**

- `locales` (`boolean`): Whether to generate `locales.kanjou.d.ts`.
- `virtual` (`boolean`): Whether to generate `virtual.kanjou.d.ts`.
- `outDir` (`string`): Base directory for generated types.
- `localesPath` (`string`): Explicit path for `locales.kanjou.d.ts`.
- `virtualPath` (`string`): Explicit path for `virtual.kanjou.d.ts`.

### `compile`

- **Type:** `CompileOptions`
- **Description:** Defaults for the `kanjou compile` CLI command.

**`CompileOptions` properties:**

- `outDir` (`string`): Default output directory.
- `extension` (`'js' | 'json'`): Output format extension.
