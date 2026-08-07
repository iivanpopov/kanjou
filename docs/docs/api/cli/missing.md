---
title: kanjou missing
---

# `kanjou missing`

> [!WARNING]
> This command is currently a **WIP / Experimental** stub.

Scans your source code to find translation keys that are used in your application but missing from your locale files.

## Usage

```bash
npx kanjou missing [options]
```

## Options

| Option                 | Alias | Description                        |
| ---------------------- | ----- | ---------------------------------- |
| `--locales-dir <dir>`  | `-l`  | Directory containing locale files. |
| `--base-locale <name>` | `-b`  | Base locale name (e.g. `en`).      |

:::warning
This command analyzes your code using `ts-morph` to extract used keys. It may not reliably detect translation keys if they are constructed dynamically at runtime (e.g., \`t(\`user.status.${status}\`)\`).
:::
