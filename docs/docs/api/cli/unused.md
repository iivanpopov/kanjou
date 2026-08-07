---
title: kanjou unused
---

# `kanjou unused`

> [!WARNING]
> This command is currently a **WIP / Experimental** stub.

Scans your application code to find translation keys that are defined in your locale files but are never used in your source code.

## Usage

```bash
npx kanjou unused [options]
```

## Options

| Option                 | Alias | Description                        |
| ---------------------- | ----- | ---------------------------------- |
| `--locales-dir <dir>`  | `-l`  | Directory containing locale files. |
| `--base-locale <name>` | `-b`  | Base locale name (e.g. `en`).      |

:::warning
Similar to the `missing` command, analysis relies on static detection via `ts-morph`. If translation keys are accessed dynamically in your code, they might be falsely flagged as unused.
:::
