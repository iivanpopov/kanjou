# Syntax: patterns, text, literals, markup

## Patterns

Formatting a message yields one pattern: the **simple message**'s bare pattern or the matching **variant**'s **quoted pattern**.

- **Simple message** (unquoted pattern):
  ```
  This is a pattern. It can include expressions like {$v} and {#bold}markup{/bold}.
  ```
  Wrap a bare pattern in `{{...}}` whenever it starts with `.` or `{{` so the parser reads it as text rather than a declaration or quoted pattern:
  ```
  {{.hidden}}
  ```
- **Quoted pattern** `{{...}}`: required in every **complex message** (declarations or `.match`), including every variant pattern.
  ```
  .local $y = {1}
  {{This pattern must be quoted.}}
  ```

## Text

Translatable content accepts any Unicode code point except surrogates U+D800–U+DFFF. Escape `\`, `{`, `}` as `\\`, `\{`, `\}`. Whitespace (spaces, tabs, newlines) inside patterns is preserved:

```
.input {$num :number}
{{   This is the {$num} pattern   }}
```

-> `   This is the 5 pattern   `

Escapes:

```
Backslash: \\, left curly brace \{, right curly brace \}
```

-> `Backslash: \, left curly brace {, right curly brace }`

## Expressions

An expression sits in `{ }` and holds an operand with an optional annotation (function and options):

```
{$date :datetime dateFields=weekday dateLength=long}
{0.42 :percent}
{|Some text|}
{$name}
```

## Literals

A literal is inline code data used as a variant key, expression operand, or option value (any option value without a leading `$`).

- **Unquoted literal**: letters, digits, `_`, `-`, `.`, `+`, and Unicode name characters.

  ```
  .local $x = {42}
  .local $y = {number42}
  .local $z = {_number}
  {{{$x} {$y} {$z}}}
  ```

  -> `42 number42 _number`

- **Quoted literal** `|...|`: required for empty literals or literals containing spaces or other punctuation (`@`, `:`, `/`, `{`, `}`, `|`, `*`); escape `\` and `|` inside `|...|` as `\\` and `\|`.
  ```
  .local $x = {|@literal|}
  .local $y = {|white space|}
  .local $z = {|{{curly braces}}|}
  {{{$x} {$y} {$z} {|and \\, a backslash|}}}
  ```
  -> `@literal white space {{curly braces}} and \, a backslash`

Place a literal used as pattern content inside an expression `{...}`, e.g. `{|2024-05-01T15:04:06| :date}`.

## Markup

**Markup** placeholders mark regions or standalone items: open `{#name}`, close `{/name}`, standalone `{#name/}`:

```
Click {#link}here{/link}. {#bold}{$count}{/bold} {#star-icon/}
```

Markup tags are app-defined pass-through tokens independent of HTML; preserve tag names verbatim and translate only the text between them.
