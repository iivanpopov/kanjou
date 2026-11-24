# Variables and declarations

## Variables

Variables reference runtime data with a `$` prefix. Variable names allow letters, digits, `_`, `-`, `.`, `+` (and Unicode name characters), starting with a character other than `-`, `.`, or `0-9`.

```
Your name is {$name}.
You have {42 :currency currency=$currency}.
```

## `.local`

Binds a new variable to an expression within the message:

```
.local $count = {42}
{{The count is: {$count}}}
```

-> `The count is: 42`

```
.local $score = {0.42}
.local $score_percent = {$score :percent}
{{Your score was {$score_percent}.}}
```

-> `Your score was 42%.`

The right-hand side may use literals, functions, and variables declared earlier, excluding the variable being defined. `.local` can also bind a formatted value for reuse:

```
.local $day = {$date :date fields=weekday length=long}
{{Today is {$day}.}}
```

## `.input`

Declares an external runtime variable; the operand must be a variable matching the declared name:

```
.input {$count :number}
{{The count is: {$count}}}
```

Uses:

- **Documentation**: `.input {$count}` documents the expected external variable for developers and translators.
- **Annotation and coercion**: `.input {$amount :currency currency=USD}` applies a function to every reference of `$amount` and surfaces bad operands early (for example, a non-numeric value under `:number` raises `bad-operand`).
- **Selector options**: options on `.input` carry into `.match`, e.g. `.input {$rank :number select=ordinal}` (see [matchers.md](matchers.md)).

## Shadowing and redeclaration

- A `.local` sharing an external runtime input's name **shadows** that input when no `.input` or earlier reference declared it first:
  ```
  .local $count = {42}
  {{The count is: {$count}}}
  ```
  With external `count=32` -> `The count is: 42`.
- Declaring any variable twice raises `duplicate-declaration` (including implicit declaration from an earlier `$var` use). Give each variable a unique name (see [errors.md](errors.md)).

Bad (redeclaring an `.input`):

```
.input {$count :number}
.local $count = {32}
{{{$count}}}
```

Bad (implicit declaration by earlier use):

```
.local $count1 = {$count}
.local $count = {32}
{{{$count1} {$count}}}
```

Good:

```
.input {$count :number}
.local $defaultCount = {32}
{{{$count} {$defaultCount}}}
```
