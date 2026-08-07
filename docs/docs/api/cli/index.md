---
title: CLI
---

# Kanjou CLI

The `@kanjou/cli` package provides a set of command-line tools to manage, compile, and maintain your locale files.

## Installation

::: code-group

```bash [npm]
npm install -D @kanjou/cli
```

```bash [pnpm]
pnpm add -D @kanjou/cli
```

```bash [yarn]
yarn add -D @kanjou/cli
```

```bash [bun]
bun add -d @kanjou/cli
```

:::

## Basic Usage

You can run the CLI using your package manager's executor:

```bash
npx kanjou <command> [options]
```

## Commands

- [`kanjou compile`](./compile.md): Compile JSON locale files into optimized `.js` or `.json` formats.
- [`kanjou generate`](./generate.md): Generate E2E type-safe `.d.ts` definitions from your base locale.
- [`kanjou compare`](./compare.md): Compare locale files to find missing translation keys across different languages.
- [`kanjou missing`](./missing.md): Find translation keys used in your source code but missing from your locale files.
- [`kanjou unused`](./unused.md): Find keys defined in your locale files that are not used in your code.
