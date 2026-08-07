---
title: Locale Files
---

# Locale Files

Kanjou expects your locale data to be defined in standard JSON or JavaScript/TypeScript files (`.json`, `.ts`, `.js`, `.mts`, `.mjs`).

## Directory Structure

You should keep all your locale files in a dedicated directory. This directory is then specified as `localesDir` in your `kanjou.config.ts`.

```txt
src/
└── locales/
    ├── en.ts
    ├── es.ts
    └── fr.ts
```

## Dictionary Format

Each file should export a **flat** object where the keys are your translation identifiers, and the values are standard MessageFormat 2 strings.

:::danger Flat Structure Only
Locale dictionaries **MUST** be flat key-value objects. Nested objects (e.g. `{ "nav": { "home": "Home" } }`) are strictly **NOT supported** and will cause compiler and runtime parser failures. Always use dot-notation for namespacing (e.g. `"nav.home": "Home"`).
:::

```typescript
export default {
  'greeting': 'Hello, {$name}!',
  'nav.home': 'Home',
  'nav.about': 'About Us',
  'errors.notFound': 'Page not found.',
} as const
```

## File Naming Conventions

The filename (excluding the extension) determines the locale identifier used in your code and Vite virtual module imports.

- `en.ts` -> Locale `en`
- `es-AR.json` -> Locale `es-AR`

You **MUST** specify a `baseLocale` (e.g. `en.ts` or `'en'`) in your `kanjou.config.ts`. Kanjou requires it as the single source of truth for generating strict TypeScript definitions and validating keys across your application.
