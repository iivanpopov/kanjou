---
title: kanjou generate
---

# `kanjou generate`

Generates TypeScript definitions (`.d.ts`) based on your locale files to enable end-to-end type safety.

## Usage

```bash
npx kanjou generate [options]
```

## Options

| Option                 | Alias | Description                               |
| ---------------------- | ----- | ----------------------------------------- |
| `--locales-dir <dir>`  | `-l`  | Directory containing locale files.        |
| `--base-locale <name>` | `-b`  | Base locale name (e.g. `en`).             |
| `--locales`            |       | Force generating `locales.kanjou.d.ts`.   |
| `--no-locales`         |       | Disable generating `locales.kanjou.d.ts`. |
| `--virtual`            |       | Force generating `virtual.kanjou.d.ts`.   |
| `--no-virtual`         |       | Disable generating `virtual.kanjou.d.ts`. |

### Example

```bash
npx kanjou generate -l ./locales -b en
```

:::info How it works
The `generate` command reads your base locale file, parses the MessageFormat 2 strings, and uses `ts-morph` to generate precise TypeScript types for your messages, including any variables and their expected types. This creates `locales.kanjou.d.ts` (for strong typing of your translation functions) and `virtual.kanjou.d.ts` (for Vite virtual module typing).
:::
