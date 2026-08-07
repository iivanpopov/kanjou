---
title: kanjou compile
---

# `kanjou compile`

Compiles your source locale files (`.ts`, `.js`, `.json`, etc.) into optimized output formats.

## Usage

```bash
npx kanjou compile [options]
```

## Options

| Option                 | Alias | Description                                                                        |
| ---------------------- | ----- | ---------------------------------------------------------------------------------- |
| `--locales-dir <dir>`  | `-l`  | Directory containing your source locale files.                                     |
| `--base-locale <name>` | `-b`  | Base locale name (e.g. `en`).                                                      |
| `--out-dir <dir>`      | `-o`  | Output directory for compiled files (defaults to `compiled` inside `locales-dir`). |
| `--extension <ext>`    | `-e`  | Output file extension: `js` or `json` (defaults to `js`).                          |

### Example

```bash
npx kanjou compile -l ./locales -b en -o ./dist/locales -e js
```

:::info How it works
The `compile` command parses your source locale files (`.ts`, `.js`, `.json`, etc.) containing MessageFormat 2 strings. If the output extension is `js`, it compiles the messages into an optimized JavaScript AST representations. This reduces the parsing overhead at runtime, significantly improving performance. The generated files are automatically formatted using your Prettier configuration.
:::
