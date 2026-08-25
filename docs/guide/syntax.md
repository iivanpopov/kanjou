---
title: 'Syntax'
---

# Syntax

**Kanjou** relies on [MessageFormat 2](https://messageformat.unicode.org). Check out their [official guide](https://messageformat.unicode.org/docs/quick-start) for a deep dive into the mechanics.

## Working with Variables

Variables hold dynamic data evaluated during execution. Every variable identifier must begin with a `$`.

```
Your name is {$name}.
```

### Defining Variables

Use the `.local` directive to create a variable right inside your message body:

```
.local $score = {0.42}
.local $pct = {$score :number style=percent}
{{Your score: {$pct}}}
```

Use the `.input` directive to map data coming from outside the message:

```
.input {$amount :number style=currency currency=USD}
{{The price is {$amount}.}}
```

Think of `.input` as built-in documentation. It clarifies the exact data type required for both software engineers and localization teams.

## Understanding Literals

Literals represent static data rather than dynamic variables. You will see them used as standalone expressions or configuration parameters.

```
Today is {$date :datetime weekday=long}.
```

In the snippet above, `long` is an unquoted literal. Unquoted literals only allow standard alphanumeric characters.

Whenever you need to include punctuation or special characters, you must enclose the literal in `|` markers:

```
The year is {$date :datetime year=|2-digit|}.
```

```
.local $x = {|hello world|}
{{{$x}}}
```

## Formatting Functions

Functions modify or format your data. The standard pattern follows the `{operand :function option=value}` shape.

### Core Numbers: `:number` and `:integer`

```
{$price :number style=currency currency=USD}
{$ratio :number style=percent}
{$pi :integer}
```

When you apply `.match` to a number, the system automatically falls back to CLDR pluralization standards:

```
.input {$count :number}
.match $count
one {{You have {$count} apple.}}
*   {{You have {$count} apples.}}
```

### Core Time: `:datetime`, `:date`, and `:time`

```
Today is {$date :datetime weekday=long}.
Short date: {$date :date style=short}.
Clock: {$date :time style=medium}.
```

### Core Text: `:string`

This is primarily useful for strict equality checks within a `.match` block:

```
.input {$role :string}
.match $role
admin {{Hello, admin.}}
*     {{Hello, user.}}
```

### Custom Formatters

You have the ability to build and register bespoke functions. Read the [Formatters](./formatters.md) page for implementation details.

```
{$languages :list type=AND}
```

## Tag Markup

Markup placeholders provide a way to inject tags into your translations. The formatter passes these tags blindly to your application layer, which then decides how to render them.

```
Click {#link}here{/link} to continue.
```

The syntax supports three tag varieties:

- `{#link}` acts as an opening element.
- `{/link}` acts as a closing element.
- `{#icon/}` acts as an independent void element.

```
{#bold}{$count}{/bold} items selected. {#star-icon/}
```

Keep in mind that markup is strictly distinct from HTML. **Kanjou** outputs the raw tags without interpreting them. You can learn more about rendering strategies in the [Rich Text](./rich-text.md) guide.
