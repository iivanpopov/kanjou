---
title: kanjou compare
---

# `kanjou compare`

Analyzes your locale files to find missing translation keys across different languages.

## Usage

```bash
npx kanjou compare [options]
```

## Options

| Option                 | Alias | Description                        |
| ---------------------- | ----- | ---------------------------------- |
| `--locales-dir <dir>`  | `-l`  | Directory containing locale files. |
| `--base-locale <name>` | `-b`  | Base locale name (e.g. `en`).      |

### Example

```bash
npx kanjou compare -l ./locales
```

When run, this command will output a list of locales along with the keys they are missing that are present in other locales.
