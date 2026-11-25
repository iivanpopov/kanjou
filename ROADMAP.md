# kanjou — Feature Roadmap

Prioritized by architectural dependency and impact (P0 → P3).

---

## P0 — Core Runtime & Tuple AST

_Foundation: zero-parse, allocation-free runtime and modular MF2 functions._

- [ ] **Opcode Tuple AST Specification**
  - Define strict TypeScript types for static strings and numeric opcode tuples (`0` Variable, `1` Formatter, `2` Selector, `3` Markup).
- [ ] **Monomorphic Core Runtime (`t`)**
  - Dense `PACKED_ELEMENTS` array lookup (`messages[id]`).
  - Static string fast-path (`typeof node === "string"`).
  - Numeric opcode `switch (node[0])` jump-table traversal.
  - Zero-allocation `Intl` cache (`intlCache[formatId]`).
- [ ] **MF2-Compatible Function API & Standard Functions**
  - Unified interface supporting formatting (`toString` / `formatToParts`) and variant selection (`selectKey` for `.match`).
  - Isolated, `"sideEffects": false` modules for `:number`, `:integer`, `:datetime`, `:date`, `:time`, `:string`.
  - Support for user-defined `customFunctions` alongside built-in functions.
- [ ] **Rich Text & Markup Runtime (`t.rich`)**
  - Recursive tree traversal for opcode `3` markup tuples (zero open/close stack overhead).
  - Local scope tag renderers passed via `vars` with fallback to global default `tags`.

---

## P1 — MF2 Compiler & Lowering Engine

_Build-time transformation from MF2 source dictionaries to optimized data payloads and types._

- [ ] **MF2 Parsing & Validation**
  - Parse MF2 source dictionaries into standard MF2 Data Model (using an existing build-time MF2 parser).
- [ ] **Opcode Tuple AST Lowering**
  - Lower MF2 Data Model into compact positional tuples.
  - Validate markup tag nesting at build time (fail on unclosed/mismatched tags) and fold paired tags into nested opcode `3` nodes.
- [ ] **Formatters Options Hoisting**
  - Extract and deduplicate unique `(fnIndex, options)` pairs per namespace into a flat `formats` table referenced by integer `formatId`.
- [ ] **Per-Namespace Dense Indexing**
  - Build `key → index` maps starting from `0` per namespace and emit compiled `[formats, messages]` JSON payloads.
- [ ] **Automatic `.d.ts` Type Generation**
  - Infer valid keys per namespace.
  - Infer strict variable types from `.input` declarations and expressions.
  - Infer `prefix` / `suffix` union types for `t.dynamic()`.
  - Infer tag renderer signatures and option props for `t.rich()`.

---

## P2 — Vite Plugin & Dev/Prod Pipeline

_Zero-CLI developer experience and production bundle optimization._

- [ ] **Development Mode & HMR**
  - Serve string-keyed catalogs (`Record<string, TupleAST>`) without code transformation for instant HMR on dictionary edits.
- [ ] **Production Code Transformation (`t` & `t.rich`)**
  - Scope-aware AST transform replacing string literal keys with integer indices (`t("auth.login.title")` → `t(0)`).
  - Throw build errors when non-literal keys are passed to `t()` or `t.rich()`.
- [ ] **Dynamic Keys — Model B (`t.dynamic`)**
  - Transform `t.dynamic(prefix, suffix, vars?)` by inlining a minimal `suffix → index` lookup object directly at the call site.
- [ ] **Automatic Function Tree-Shaking (`virtual:kanjou/functions`)**
  - Collect referenced MF2 functions across all dictionaries, assign `fnIndex`, and emit a virtual module exporting a dense array (`export const functions = [...]`).

---

## P3 — Advanced Optimizations & Framework Bindings

_Maximum bundle reduction and ergonomic framework integration._

- [ ] **Dead Key Elimination (DKE)**
  - Pre-scan source files (e.g., via `oxc-parser`) to collect live keys from `t()`, `t.rich()`, and `t.dynamic()` prefixes, omitting unused keys before dense indexing.
- [ ] **Framework Adapters (`@kanjou/react`, etc.)**
  - Lightweight hooks/providers for passing compiled JSON namespace arrays cleanly across SSR / RSC boundaries.

# Specification

## 1. Opcode Tuple AST & Catalog Format

A compiled namespace payload is a 2-element JSON tuple:

```ts
type CompiledNamespace = [formats: FormatEntry[], messages: CompiledMessage[]]

// Hoisted formatter entry: [fnIndex, options]
// fnIndex references `virtual:kanjou/functions` (dense array)
type FormatEntry = [fnIndex: number, options?: Record<string, unknown>]
```

### Message & Node Types

```ts
// Fast-path: static messages without expressions/markup are raw strings
type CompiledMessage = string | AstNode[]

type AstNode =
  | string // Literal text
  | VariableNode // Opcode 0
  | FormatterNode // Opcode 1
  | SelectorNode // Opcode 2
  | MarkupNode // Opcode 3

// 0: Simple variable interpolation — {$name}
type VariableNode = [0, varName: string]

// 1: Formatted expression — {$price :number style=currency currency=EUR}
type FormatterNode = [1, varName: string, formatId: number]

// 2: Flat MF2 .match selector
// selectors: list of variable names or hoisted [varName, formatId]
// variants: [keys, pattern], where "*" is the catch-all key
type SelectorInput = string | [varName: string, formatId: number]
type SelectorVariant = [keys: string[], pattern: AstNode[]]
type SelectorNode = [2, selectors: SelectorInput[], variants: SelectorVariant[]]

// 3: Folded markup tag — {#link href=/terms}{$text}{/link} or {#br/}
type MarkupNode =
  | [3, tagName: string]
  | [3, tagName: string, props: Record<string, unknown>]
  | [3, tagName: string, props: Record<string, unknown> | null, children: AstNode[]]
```

### Example Compiled Catalog (`en/auth.json`)

```json
[
  [
    [0, {}],
    [0, { "style": "currency", "currency": "EUR" }]
  ],
  [
    "Sign in to your account",
    [
      [
        2,
        [["count", 0]],
        [
          [["one"], [[1, "count", 0], " attempt left"]],
          [["*"], [[1, "count", 0], " attempts left"]]
        ]
      ]
    ],
    ["By continuing, you agree to our ", [3, "link", { "href": "/terms" }, [[0, "text"]]], "."],
    ["Total: ", [1, "price", 1]]
  ]
]
```

---

## 2. Public API

### Initialization (`createIntl`)

```ts
import { functions } from 'virtual:kanjou/functions'
import { createIntl } from '@kanjou/core'

export interface MF2Function<TValue = unknown, TOptions = Record<string, unknown>> {
  format(locale: string, value: TValue, options?: TOptions): string
  selectKey?(locale: string, value: TValue, keys: string[], options?: TOptions): string | undefined
}

export type TagRenderer<TNode = unknown, TProps = Record<string, unknown>> = (
  children: TNode[],
  props: TProps,
) => TNode

export interface CreateIntlOptions<TNode unknown> {
  locale: string
  catalog: CompiledNamespace
  functions: MF2Function[]
  customFunctions?: Record<string, MF2Function>
  tags?: Record<string, TagRenderer<TNode>>
}

export const kanjou = createIntl({
  locale: 'en',
  catalog: enAuthCatalog,
  functions,
  customFunctions: {
    customCurrency,
  },
  tags: {
    b: (children) => <strong>{children}</strong>,
    br: () => <br />,
  },
})

```

### Translation Methods (`t`, `t.rich`, `t.dynamic`)

#### 1. Plain String Translation — `t(key, vars?)`

Always returns `string`. Static fast-path with zero allocations.

```ts
// Source (dev & TS)
t('auth.login.title')
t('auth.login.attempts', { count: 3 })

// Production (transformed by Vite plugin)
t(0)
t(1, { count: 3 })
```

#### 2. Rich Text / Markup Translation — `t.rich(key, vars?)`

Returns `TNode[]` (e.g., `ReactNode[]`). Tag renderers are passed in `vars` with fallback to global `tags`.

```tsx
// Source (dev & TS)
t.rich('auth.login.terms', {
  text: 'Terms of Service',
  link: (children, props) => (
    <a href={props.href} onClick={handleClick}>
      {children}
    </a>
  ),
})

// Production (transformed by Vite plugin)
t.rich(2, {
  text: 'Terms of Service',
  link: (children, props) => (
    <a href={props.href} onClick={handleClick}>
      {children}
    </a>
  ),
})
```

#### 3. Dynamic Key Lookup (Model B) — `t.dynamic(prefix, suffix, vars?)`

`prefix` must be a string literal. `suffix` is strictly narrowed by generated `.d.ts` union types.

```ts
// Source (dev & TS)
t.dynamic('order.status', status, { count })

// Production (inlined by Vite plugin)
t({ paid: 14, pending: 15, canceled: 16 }[status], { count })
```

---

## 3. Virtual Module Contract

The Vite plugin emits `virtual:kanjou/functions` containing only the MF2 functions referenced in compiled dictionaries, ordered to match each hoisted `fnIndex`:

```ts
import { datetime } from '@kanjou/core/functions/datetime'
// virtual:kanjou/functions
import { number } from '@kanjou/core/functions/number'

export const functions = [number, datetime]
```
