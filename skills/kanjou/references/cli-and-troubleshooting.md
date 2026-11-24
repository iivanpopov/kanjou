# CLI & Troubleshooting (`@kanjou/cli`)

## CLI commands

All commands read `kanjou.config.json` from the current working directory:

| Command                                                           | Purpose                                                                                       |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `kanjou compile`                                                  | Precompile all locales/namespaces into JS modules in `compile.outDir` (default `./generated`) |
| `kanjou generate`                                                 | Generate `locales.kanjou.d.ts` in `dts.outDir` (default `./generated`)                        |
| `kanjou compare`                                                  | Cross-compare all locales against each other and report missing keys per locale               |
| `kanjou unused [--tsconfig <path>] [--ignore-full-catalog-union]` | Scan TypeScript sources for unused base-locale message keys                                   |

### `kanjou unused` notes

- Uses the TypeScript project specified by `--tsconfig` (or discovers `tsconfig.json` in the workspace).
- Recognizes `t(...)`, `t.parts(...)`, `t.rich(...)`, `useTranslate()(...)`, `defineTranslate`, and `formatMessage*` calls; dynamic `t.unsafe(...)` calls do not mark specific keys as used unless typed.
- Pass `--ignore-full-catalog-union` to ignore dynamic keys whose type widens to the entire `MessageId` union.

## Troubleshooting

- **Raw MF2 string rendered in UI**: Messages were imported directly from `src/locales/*.ts` instead of `virtual:kanjou/*` or `compile.outDir`. Always import precompiled modules.
- **Type errors in `node_modules` with `@kanjou/plugin`**: Enable `"skipLibCheck": true` in `tsconfig.json`.
- **No autocomplete for `t('...')` keys**: Ensure `kanjou generate` (or `@kanjou/plugin` build/dev) emitted `locales.kanjou.d.ts` and that `tsconfig.json` includes it along with `/// <reference types="@kanjou/plugin/client" />` (or `@kanjou/plugin/client/core`).
- **Reserved locale name error**: Rename any locale file or directory named `locales` or `namespaces`.
