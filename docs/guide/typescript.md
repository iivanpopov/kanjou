---
title: 'TypeScript'
---

# TypeScript

**Kanjou** is built with TypeScript and provides baseline declarations out of the box. However, achieving strict, end-to-end type safety for your translations—where message keys, variables, and locale strings are all statically checked—requires explicitly linking your specific translation data to **Kanjou**'s type system.

## The `Register` Interface

The core of this type system is a deliberately empty interface named `Register`, which is exported directly from `@kanjou/react`:

```ts
export interface Register {}
```

**Kanjou** relies on TypeScript's declaration merging. By augmenting this interface within your project, you override the default loose types (where keys are `string` and variables are `any`) with the exact shape of your application's translations.

You can populate three optional properties:

| Field       | Type                                  | Description                                |
| ----------- | ------------------------------------- | ------------------------------------------ |
| `messages`  | `Record<string, Record<string, ...>>` | The structural shape of your base locale.  |
| `locale`    | string union                          | The exact locale codes your app supports.  |
| `functions` | object                                | Type signatures for any custom formatters. |

Once this interface is augmented, APIs like `t()`, `useKanjou()`, and `<KanjouProvider>` inherit these strict types globally.

## Extending `Register` Manually

You can configure this by hand. Create a `.d.ts` file (for example, `kanjou.d.ts`) anywhere in your source tree and define the module shape:

```ts [kanjou.d.ts]
import type en from './locales/en'

declare module '@kanjou/react' {
  interface Register {
    messages: typeof en
    locale: 'en' | 'uk' | 'ja'
  }
}
```

While the manual approach works fine, **Kanjou** provides tooling to generate and maintain this file automatically via Vite or the CLI.

## Generating Types via Vite

If your project uses `@kanjou/vite`, you only need to configure the `dts` property. The plugin generates the declaration file on startup and continuously updates it via HMR whenever you edit your base translation file.

```ts [vite.config.ts]
import { kanjou } from '@kanjou/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    kanjou({
      dts: {
        outDir: 'src/types',
      },
    }),
  ],
})
```

The next time you run `vite dev` or `vite build`, the plugin will write a `locales.kanjou.d.ts` file into the `src/types/` directory based on your locale data.

Refer to the [Vite Plugin Reference](../reference/vite-plugin.md) for advanced configuration options.

## Generating Types via CLI

For projects not utilizing Vite, `@kanjou/cli` provides a `generate` command that performs the exact same type extraction on demand.

::: code-group

```sh [npm]
npx kanjou generate
```

```sh [yarn]
yarn dlx kanjou generate
```

```sh [pnpm]
pnpm dlx kanjou generate
```

```sh [bun]
bunx kanjou generate
```

:::

You will typically want to wire this into your npm scripts so you can run it whenever you update your base locale:

```json [package.json]
{
  "scripts": {
    "gen:kanjou": "kanjou generate"
  }
}
```

The CLI supports flags to customize the output paths and behavior:

```sh
# Specify a custom locales directory and output location
kanjou generate --locales-dir src/i18n --base-locale en

# Generate only the Register augmentation, skip virtual module types
kanjou generate --no-virtual
```

Refer to the [CLI Reference](../reference/cli.md) for a complete list of flags.

## The Output

Regardless of whether you use Vite or the CLI, the resulting declaration file will look something like this:

```ts [locales.kanjou.d.ts]
declare module '@kanjou/react' {
  interface Register {
    messages: {
      apples: {
        count: number
      }
      greeting: Record<string, never>
    }
    locale: 'en' | 'uk'
  }
}
```

As long as this file is picked up by your `tsconfig.json`[^1], your codebase immediately benefits from:

- **Strict message IDs:** Calling `t('apples')` triggers a compiler error.
- **Strict variables:** Calling `t('apples', { count: 'invalid' })` triggers a compiler error.
- **Strict locales:** Rendering `<KanjouProvider locale="fr">` triggers a compiler error if `fr` is absent from the union.

## Typing Custom Functions

When implementing [custom formatters](./formatters.md), you can teach **Kanjou** their expected input shapes by populating the `functions` property on the `Register` interface. This allows `t()` to properly infer variable types for that specific function.

```ts [kanjou.d.ts]
import type { MessageFunction } from '@kanjou/react'

type ListFunction = MessageFunction<{ type?: 'AND' | 'OR' }, string[], 'string'>

declare module '@kanjou/react' {
  interface Register {
    functions: {
      list: ListFunction
    }
  }
}
```

[^1]: Ensure your generated `.d.ts` file is covered by the `include` glob in your `tsconfig.json` (e.g., `"include": ["src"]`). If you output the file outside of `src`, you must add its path explicitly.
