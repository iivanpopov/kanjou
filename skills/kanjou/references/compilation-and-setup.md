# Compilation & Bundler Setup

## Three-tier compilation (`@kanjou/generator`)

During `kanjou compile` or `@kanjou/plugin` virtual module loading, every message is parsed, validated, and classified into one of three tiers:

1. **`plain`**: Empty message or single text part with no declarations, expressions, `.match`, or markup.
   - Input: `"key.key1": "Hola"`
   - Output: `["key.key1"]:"Hola"`
   - Runtime: Returned directly as a string.
2. **`simple`**: Pattern message with no declarations, containing only text and bare `{$var}` expressions (no `:function`, no `.match`, no markup).
   - Input: `"key.key2": "Hi, {$name}"`
   - Output: `` ["key.key2"]:(v)=>`Hi, ${v?.name??"{$name}"}` ``
   - Behavior: Falls back to `"{$var}"` when `null` or `undefined`; supports dotted variable paths (`v?.user?.name` and flat `v?.["user.name"]`). Runs without AST or `MessageFormat`.
3. **`complex`**: Any message with `.input`, `.local`, `.match`, `:function` (e.g. `{$count :number}`), or `{#markup}`.
   - Output: Serialized `Model.Message` JSON AST.
   - Runtime: Executed by `@kanjou/core` via `new MessageFormat(locale, ast, options)` without parsing source strings.

## `kanjou.config.json`

Placed in the project root (all fields optional):

| Field        | Default                       | Purpose                                                                                                  |
| ------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `baseLocale` | `"en"`                        | Source of truth locale for `locales.kanjou.d.ts`, `compare`, `unused`                                    |
| `localesDir` | `"./src/assets/locales"`      | Directory containing locale source files (`.ts`, `.js`, `.mts`, `.mjs`)                                  |
| `compile`    | `{ "outDir": "./generated" }` | Output directory for `kanjou compile`                                                                    |
| `dts`        | `{ "outDir": "./generated" }` | Set `false` to disable `locales.kanjou.d.ts`; `dts.module` targets `'@kanjou/react'` or `'@kanjou/core'` |
| `prettier`   | `true`                        | Format generated `.d.ts` with Prettier (`boolean \| PrettierOptions`)                                    |

### Locale directory layout

- **Flat files**: `<localesDir>/en.ts`, `<localesDir>/es.ts` exporting `export default { ... } as const` (keys mapped to strings).
- **Namespace directories**: `<localesDir>/en/common.ts`, `<localesDir>/en/auth.ts` imported as `virtual:kanjou/en/common`.
- **Reserved names**: `locales`, `namespaces`, and `functions` are reserved for virtual modules and cannot be used as locale names.

## Bundler plugin (`@kanjou/plugin`)

Register in Vite or Webpack:

- Vite: `import kanjou from '@kanjou/plugin/vite'` -> `plugins: [kanjou()]`
- Webpack: `import kanjou from '@kanjou/plugin/webpack'` -> `plugins: [kanjou()]`

The plugin:

- Emits `locales.kanjou.d.ts` on `buildStart` and `watchChange` (when `dts !== false`).
- Stubs `messageformat`'s runtime parser (`parseMessage` throws `[kanjou] Runtime MF2 string parsing is disabled; pre-compile messages with @kanjou/plugin.`) and tree-shakes unused built-in functions.

### Virtual modules & TypeScript client types

| Import                         | Purpose                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `virtual:kanjou/<locale>`      | Precompiled messages for a flat locale                                       |
| `virtual:kanjou/<locale>/<ns>` | Precompiled messages for a locale namespace                                  |
| `virtual:kanjou/locales`       | Lazy loader map `Record<Locale, () => Promise<Messages>>`                    |
| `virtual:kanjou/namespaces`    | Lazy loader map `Record<Locale, Record<Namespace, () => Promise<Messages>>>` |
| `virtual:kanjou/functions`     | Tree-shaken built-in MF2 functions used by the base locale                   |

Add client ambient declarations and enable `skipLibCheck: true` in `tsconfig.json`:

- React projects: `/// <reference types="@kanjou/plugin/client" />`
- Core-only projects: `/// <reference types="@kanjou/plugin/client/core" />` (and set `dts.module: "@kanjou/core"` in `kanjou.config.json`).
