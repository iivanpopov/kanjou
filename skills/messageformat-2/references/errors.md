# MF2 errors: failing and corrected examples

Error names in parentheses match the JS `messageformat` implementation. Syntax and data-model errors fail at parse/validation time with no fallback output.

## Syntax errors (`missing-syntax`, `bad-escape`, `parse-error`)

Missing `{{ }}` around a **complex message** pattern:

Bad:

```
.input {$x :number}
Value: {$x}
```

Good:

```
.input {$x :number}
{{Value: {$x}}}
```

Unescaped `{` in text or unquoted literal with spaces:

Bad:

```
.local $label = {two words}
{{Use {literal} braces}}
```

Good:

```
.local $label = {|two words|}
{{Use \{literal\} braces: {$label}}}
```

## Variant key mismatch (`key-mismatch`)

Each **variant** needs one key per **selector**.

Bad:

```
.local $x = {1 :number}
.match $x
one * {{Too many keys}}
*   * {{Also too many keys}}
```

Good:

```
.local $x = {1 :number}
.match $x
one {{x is singular}}
*   {{x is plural}}
```

## Missing fallback variant (`missing-fallback`)

Every `.match` requires an **all-`*` fallback**.

Bad:

```
.local $x = {1 :number}
.match $x
one {{x is singular}}
```

Good:

```
.local $x = {1 :number}
.match $x
one {{x is singular}}
*   {{x is plural}}
```

## Duplicate variant (`duplicate-variant`)

Key lists must be unique (`one *` and `* one` are distinct).

Bad:

```
.input {$x :number}
.match $x
one {{x is singular}}
one {{x is singular.}}
*   {{x is plural}}
```

Good:

```
.input {$x :number}
.match $x
one {{x is singular}}
*   {{x is plural}}
```

## Missing selector annotation (`missing-selector-annotation`)

Every **selector** needs a selectable function annotation on itself or via transitive `.local` declarations.

Bad:

```
.match $x
one {{x is singular}}
*   {{x is plural}}
```

Good:

```
.input {$x :number}
.match $x
one {{x is singular}}
*   {{x is plural}}
```

Good (transitive annotation):

```
.input {$x :number}
.local $y = {$x}
.match $y
one {{x is singular}}
*   {{x is plural}}
```

## Duplicate declaration (`duplicate-declaration`)

A variable can be declared once (see [variables.md](variables.md) for shadowing vs redeclaration).

Bad:

```
.input {$x :number}
.local $x = {42}
{{{$x}}}
```

Good:

```
.input {$x :number}
.local $y = {42}
{{{$x} {$y}}}
```

## Duplicate option name (`duplicate-option-name`)

Bad:

```
.input {$x :number useGrouping=always useGrouping=never}
{{{$x}}}
```

Good:

```
.input {$x :number useGrouping=always}
{{{$x}}}
```

## Unresolved variable (`unresolved-variable`)

Every `$var` without a `.local` needs a runtime value; `{1}` or a runtime argument fixes missing inputs:

```
.input {$x :number}
{{{$x}}}
```

Fails when `x` is omitted at runtime; formats when `x = 5`.

## Unknown function (`unknown-function`)

Bad:

```
.local $x = {1 :num}
{{{$x}}}
```

Good:

```
.local $x = {1 :number}
{{{$x}}}
```

Verify spelling, and ensure custom or draft functions (such as `:datetime` or `:currency`) are registered in the formatter.

## Bad selector (`bad-selector`)

Required selectable functions are `:number`, `:integer`, `:offset`, `:string` (and draft `:percent`). Formatter-only functions (`:datetime`, `:date`, `:time`, `:currency`, `:unit`) and unsupported `select` options (use `cardinal`, `ordinal`, or `exact`) fail selection.

Bad:

```
.local $day = {|2024-05-01| :datetime}
.match $day
* {{The due date is {$day}}}
```

Good (format directly without `.match`):

```
.local $day = {|2024-05-01| :datetime}
{{The due date is {$day}}}
```

## Bad operand (`bad-operand`)

Pass a numeric value to `:number`/`:integer`/`:offset`/`:percent`/`:currency`/`:unit`, and an ISO 8601 string or `Date` to `:datetime`/`:date`/`:time`.

Bad:

```
.local $horse = {|horse| :number}
{{{$horse}}}
```

Good:

```
.input {$numHorses :number}
.match $numHorses
one {{You have a horse.}}
*   {{You have {$numHorses} horses.}}
```

## Bad option (`bad-option`)

Check allowed option names and values in [functions.md](functions.md).

Bad:

```
{1 :number minimumFractionDigits=foo}
```

Good:

```
{1 :number minimumFractionDigits=2}
```

-> `1.00`

## Invalid variant key

A strict or custom selector can reject keys incompatible with its operand type (for example, a non-numeric key against a numeric-only selector); keep variant keys valid for the selector function.
