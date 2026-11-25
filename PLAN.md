# kanjou

## 1. Core Principles

- **Zero-Parse Runtime:** No MF2 parser ships to the client. The runtime only traverses precompiled tuple ASTs.
- **Pure Data Payloads:** Compiled catalogs are plain JSON arrays containing primitives and nested tuples—no generated JS functions. Fully serializable for SSR/RSC (e.g., Next.js Flight) and highly compressible with Brotli/Gzip.
- **Monomorphic Hot-Path:** In production, `t()` strictly accepts an integer index (`number`) and reads directly from a dense `PACKED_ELEMENTS` array (`catalog[id]`).
- **Plugin-Driven Pipeline:** All compilation, AST lowering, type generation, code transformation, and function tree-shaking happen inside the bundler plugin—no separate CLI build step required.
- **Explicit Namespacing:** Manual, feature- or route-based namespacing (`common`, `auth`, `checkout`) for predictable caching, clean RSC prop passing, and zero bundler-splitting magic.
- **Pay-As-You-Go Formatting:** Standard MF2 functions (`:number`, `:datetime`, etc.) are modular and automatically tree-shaken if unused.

## 2. Source Format & Namespacing

- **Syntax:** MessageFormat 2.0 (MF2).
- **Keys:** Human-readable, hierarchical string keys (`"auth.login.title"`, `"order.status.paid"`).
- **Namespaces:** Dictionaries are organized by locale and namespace. Each namespace is an independent compilation and loading unit.

Example source dictionary (`locales/en/auth.json`):

```json
{
  "auth.login.title": "Sign in to your account",
  "auth.login.attempts": ".input {$count :number}\n.match $count\none {{{$count} attempt left}}\n* {{{$count} attempts left}}",
  "auth.login.terms": "By continuing, you agree to our {#link href=/terms}{$text}{/link}."
}
```

## 3. Bundler Plugin Pipeline

The bundler plugin (Vite / Rollup / SWC / Babel) handles the entire compilation and transformation lifecycle automatically during development and production builds.

### 3.1. MF2 Parsing & Tuple AST Lowering

The plugin parses MF2 source dictionaries into the standard MF2 Data Model for validation, then lowers them into a compact positional **Tuple AST** (stripping object wrappers and keys like `type`, `arg`, `value`):

- **Static strings (no variables):** Kept as raw primitive strings (`"Sign in to your account"`).
- **Interpolation:** Array of strings and variable tuples (`["Hello, ", ["name"], "!"]`).
- **Function calls with options:** Positional tuple (`["price", "number", { "style": "currency", "currency": "EUR" }]`).
- **Selectors (`.match`):** Flat variant table preserving MF2's non-recursive selector model.
- **Markup (`{#tag}...{/tag}` & `{#tag/}`):** Rather than emitting flat open/close tokens, the plugin validates tag nesting at build time (failing the build on unclosed or mismatched tags) and folds paired tags into a nested tuple node:
- Paired tag: `["#link", { "href": "/terms" }, [["text"]]]`
- Standalone tag: `["#br", {}]` (or `["#br"]` when no options are present)

### 3.2. Per-Namespace Integer Indexing

For each namespace, the plugin builds an in-memory `key → index` map starting from `0` and compiles the dictionary into a flat JSON array:

```json
// Compiled en/auth catalog
[
  "Sign in to your account",
  [/* lowered Tuple AST for auth.login.attempts */],
  ["By continuing, you agree to our ", ["#link", { "href": "/terms" }, [["text"]]], "."]
]
```

### 3.3. Automatic TypeScript Type Generation (`.d.ts`)

Directly from the parsed MF2 Data Model, the plugin generates and updates `.d.ts` definitions:

- Valid translation keys per namespace.
- Strict variable types inferred from `.input` declarations and function signatures (e.g., `t("auth.login.attempts", { count: number })`).
- Valid `prefix` and `suffix` union types for `t.dynamic()`.
- Strict tag renderer signatures and option props for `t.rich()` inferred from MF2 markup nodes (e.g., `link: (children: TNode[], props: { href: string }) => TNode`).

### 3.4. Static Call Transformation (`t` & `t.rich`)

In production builds, the plugin enforces that the first argument to `t()` and `t.rich()` is a string literal (throwing a build error otherwise) and replaces string keys with their integer indices—completely stripping key strings from the bundle:

```ts
// Source:
t('auth.login.title')
t('auth.login.attempts', { count })
t.rich('auth.login.terms', { text: 'Terms', link })

// Production bundle:
t(0)
t(1, { count })
t.rich(2, { text: 'Terms', link })
```

### 3.5. Dynamic Keys — Model B (`t.dynamic`)

Dynamic lookups use a dedicated API with an explicit static prefix: `t.dynamic(prefix, suffix, vars?)`.

- `prefix` must be a string literal.
- TypeScript narrows `suffix` to the exact union of matching keys under that prefix (e.g., `"paid" | "pending" | "canceled"`).
- At build time, the plugin inlines a minimal `suffix → index` lookup object directly at the call site:

```ts
// Source:
t.dynamic('order.status', status, { count })

// Production bundle:
t({ paid: 14, pending: 15, canceled: 16 }[status], { count })
```

No global dynamic key map is emitted; if `t.dynamic` is unused, it adds zero bytes to the bundle.

### 3.6. Automatic Function Tree-Shaking (`virtual:kanjou/functions`)

While compiling MF2 dictionaries, the plugin collects a `Set<string>` of all MF2 functions actually referenced across the project (e.g., `number`, `datetime`) and exposes them via a virtual module:

```js
import { datetime } from '@kanjou/core/functions/datetime'
// Auto-generated virtual:kanjou/functions
import { number } from '@kanjou/core/functions/number'

export const functions = { number, datetime }
```

Each built-in MF2 function lives in an isolated, side-effect-free module (`"sideEffects": false`). Unused formatters are completely eliminated by the bundler.

---

## 4. Runtime & Function API

### 4.1. Core Runtime

- **Direct Array Lookup:** `const node = catalog[id]` (O(1) dense array access in V8 without string hashing).
- **Static String Fast-Path:** `if (typeof node === "string") return node`—zero allocations for the 70–85% of messages that are static text.
- **`Intl` Instance Caching:** Internal cache for `Intl.PluralRules`, `Intl.NumberFormat`, and `Intl.DateTimeFormat` keyed by `locale + serialized options` to avoid expensive constructor calls during rendering.

### 4.2. MF2-Compatible Function API

Standard functions (`:number`, `:integer`, `:datetime`, `:date`, `:time`, `:string`) and custom user functions share a unified MF2-compatible interface:

- Receives `(locale, value, options)` extracted from the Tuple AST.
- Supports formatting (`toString` / `formatToParts`).
- Optionally supports variant selection (`selectKey`) for use in `.match` selectors.
- Custom functions are merged with the auto-generated virtual registry at initialization:

```ts
import { createIntl } from '@kanjou/core'
import { functions } from 'virtual:kanjou/functions'

export const kanjou = createIntl({
  functions: { ...functions, customCurrency },
})
```

### 4.3. Rich Text & Markup (`t.rich`)

Markup rendering is intentionally separated from `t()` so the plain-string hot-path stays allocation-free and always returns `string`.

- **Zero Stack Overhead:** Because paired tags are folded into nested tuples at build time, `t.rich()` simply traverses the tree recursively and passes rendered `children` and `props` to the tag handler—no runtime open/close stack is needed.
- **Local Scope Access:** Tag renderers are passed directly in `vars` at the call site, giving them immediate access to local state, hooks, event handlers, and routers without global context hacks:

```tsx
t.rich('auth.login.terms', {
  text: 'Terms of Service',
  link: (children, props) => (
    <a href={props.href} onClick={handleClick}>
      {children}
    </a>
  ),
})
```

- **Global Default Tags (Optional):** Common formatting tags (e.g., `{#b}`, `{#br/}`) can be registered once in `createIntl({ tags })`. At runtime, `t.rich()` resolves `vars[tagName]` first and falls back to `tags[tagName]`:

```tsx
export const kanjou = createIntl({
  functions,
  tags: {
    b: (children) => <strong>{children}</strong>,
    br: () => <br />,
  },
})
```
