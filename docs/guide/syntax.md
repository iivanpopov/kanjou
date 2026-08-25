---
title: 'Syntax'
---

# Syntax

**Kanjou** is using [MessageFormat 2](https://messageformat.unicode.org) under the hood, so refer to their [docs](https://messageformat.unicode.org/docs/quick-start) for detailed view.

## Variables

Variables are runtime values prefixed with `$`.

```
Your name is {$name}.
```

### Declarations

Use `.local` to define a variable **inside** the message:

```
.local $score = {0.42}
.local $pct = {$score :number style=percent}
{{Your score: {$pct}}}
```

Use `.input` to **explicitly annotate** an external variable:

```
.input {$amount :number style=currency currency=USD}
{{The price is {$amount}.}}
```

`.input` acts as documentation — it tells both the developer and the translator what to expect.

## Literals

A literal is a **hardcoded value** — not a variable. It appears as an option value or standalone expression.

```
Today is {$date :datetime weekday=long}.
```

Here `long` is an **unquoted** literal — just alphanumeric text.

When a literal contains special characters (like `-` or `.`), **quote it** with `|`:

```
The year is {$date :datetime year=|2-digit|}.
```

```
.local $x = {|hello world|}
{{{$x}}}
```

## Functions

Functions transform or format a value. Syntax: `{operand :function option=value}`.

### Built-in: `:number` / `:integer`

```
{$price :number style=currency currency=USD}
{$ratio :number style=percent}
{$pi :integer}
```

As a **selector** in `.match` — uses CLDR plural rules by default:

```
.input {$count :number}
.match $count
one  {{You have {$count} apple.}}
*    {{You have {$count} apples.}}
```

### Built-in: `:datetime` / `:date` / `:time`

```
Today is {$date :datetime weekday=long}.
Short date: {$date :date style=short}.
Clock: {$date :time style=medium}.
```

### Built-in: `:string`

Useful for **exact matching** in `.match`:

```
.input {$role :string}
.match $role
admin {{Hello, admin.}}
*     {{Hello, user.}}
```

### Custom functions

You can register your own — see [Formatters](./formatters.md).

```
{$languages :list type=AND}
```

## Markup

Markup placeholders let you **wrap text in tags** without the formatter interpreting them — the host app decides what they mean.

```
Click {#link}here{/link} to continue.
```

- `{#link}` — **opening** tag
- `{/link}` — **closing** tag
- `{#icon/}` — **standalone** tag (self-closing)

```
{#bold}{$count}{/bold} items selected. {#star-icon/}
```

> Markup is **not HTML**. The formatter passes tags through as-is. See [Rich Text](./rich-text.md) for how Kanjou handles them.
