---
name: kanjou
description: Kanjou i18n library (@kanjou/core, @kanjou/react, @kanjou/plugin, @kanjou/cli): configure precompilation, optimize messages across the 3 compilation tiers, use runtime APIs, or run CLI checks. Trigger on @kanjou/* imports, kanjou.config.json, virtual:kanjou/*, TranslateProvider, useTranslate, or kanjou CLI commands.
metadata:
  version: '1.0'
---

# Kanjou i18n

## Core rules

1. **Precompilation-only**: `@kanjou/cli`, `@kanjou/generator`, and `@kanjou/plugin` require **Node >= 20** (ESM-only), and locales must be **precompiled** via `@kanjou/plugin` (`virtual:kanjou/<locale>`) or `@kanjou/cli` (`kanjou compile`) before passing them to `createTranslate` or `TranslateProvider`.
2. **Three-tier compilation**: Author messages to stay on the lightest tier needed:

   | Tier       | Trigger condition                                                                     | Compiled output               | Runtime cost                                |
   | ---------- | ------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------- |
   | `plain`    | Empty or plain text with no variables, declarations, `.match`, `:function`, or markup | JS string literal (`"Hola"`)  | Zero function/AST overhead                  |
   | `simple`   | Text + bare `{$var}` (no `:function`, `.input`/`.local`, `.match`, or markup)         | Inline arrow `(v) => \`...\`` | Zero AST/`MessageFormat`                    |
   | `compiled` | Any `.input`/`.local`, `.match`, `:function`, or `{#markup}`                          | AOT-compiled JS renderer      | Zero `messageformat` runtime; cached `Intl` |

3. **TypeScript setup**: Enable `skipLibCheck: true` in `tsconfig.json` when using `@kanjou/plugin`. Reference `@kanjou/plugin/client` (for `@kanjou/react`) or `@kanjou/plugin/client/core` (for `@kanjou/core`), and include the generated `locales.kanjou.d.ts` in `tsconfig.json`.
4. **Reserved locale names**: Keep locale and namespace filenames distinct from `locales` and `namespaces`.

## References

Load only the reference file(s) matching the task branch:

| Task branch                                                            | Reference                                                                      |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 3-tier compilation, `kanjou.config.json`, bundler plugins, `virtual:*` | [references/compilation-and-setup.md](references/compilation-and-setup.md)     |
| `@kanjou/core`, `@kanjou/react`, `@kanjou/react/server`, functions     | [references/runtime-api.md](references/runtime-api.md)                         |
| `@kanjou/cli` commands (`compile`, `generate`, `compare`, `unused`)    | [references/cli-and-troubleshooting.md](references/cli-and-troubleshooting.md) |

## Workflow

1. Load the reference file(s) matching the task branch before editing config, bundler setup, or translation calls.
2. Verify that messages flow through `virtual:kanjou/*` or `kanjou compile` output rather than raw source locale files.
3. Prefer `plain` or `simple` messages when formatting functions, selectors, and markup are unnecessary; use `MessageFormat 2` syntax for `compiled` messages.
4. Run `kanjou generate` / `kanjou compile` (or build with `@kanjou/plugin`) and `kanjou compare` / `kanjou unused` to verify types and key coverage.

## Checklist

1. `kanjou.config.json` points `localesDir` to the source locale directory and sets `baseLocale` (and `dts.module` if using `@kanjou/core` without `@kanjou/react`).
2. `tsconfig.json` sets `skipLibCheck: true` and includes `locales.kanjou.d.ts` plus `@kanjou/plugin/client` (or `@kanjou/plugin/client/core`).
3. Every `TranslateProvider`, `createTranslate`, and `defineTranslate` call receives precompiled messages from `virtual:kanjou/*` or `compile.outDir`.
4. Custom MF2 functions can be passed in `options.functions` (or `TranslateProvider` `functions` prop) and typed via `Register['functions']`; built-in and draft functions (`:number`, `:integer`, `:offset`, `:currency`, `:percent`, `:date`, `:datetime`, `:time`, `:unit`, `:string`) are AOT-compiled directly.
