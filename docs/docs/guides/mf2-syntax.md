---
title: MessageFormat 2 Syntax Guide
---

# MessageFormat 2 Syntax Guide

This guide is not a full tutorial, but a quick reference for the MessageFormat 2 (MF2) syntax patterns you'll use most often with Kanjou.

## Simple Messages

Variables are prefixed with a `$` and wrapped in curly braces.

```txt
{Hello, {$name}!}
```

## Variable Input and Formatting (`.input`)

You can declare inputs explicitly to enforce types and apply formatters (like `:number`).

```txt
.input {$count :number}
{{You have {$count} unread messages.}}
```

## Local Variables (`.local`)

Use `.local` to compute or format a value once and reuse it in your message.

```txt
.local $greeting = {Hello}
{{{$greeting}, {$name}! {$greeting} to you too!}}
```

## Selectors and Plurals (`.match`)

MF2 uses the `.match` keyword for powerful conditional branching, replacing the messy nested structures of older formats.

```txt
.input {$count :number}
.match $count
1 {{You have exactly one item in your cart.}}
one {{You have {$count} item in your cart.}}
* {{You have {$count} items in your cart.}}
```

You can match on exact numerical values (like `1`), on plural categories (like `one`, `few`, `many`), or on a fallback catch-all `*` (which represents the `other` category).

## Markup and Components

MF2 supports markup syntax which Kanjou leverages for rich text and React component embedding.

```txt
{Please click {#link}here{/link} to continue.}
```

In your React code, you can use `KanjouRich` (provided that `link` is configured globally in your `KanjouProvider`):

```tsx
<KanjouRich id="auth.login_prompt" />
```

---

For complete details on the syntax and advanced capabilities, refer to the [official MessageFormat 2 specification](https://github.com/unicode-org/message-format-wg).
