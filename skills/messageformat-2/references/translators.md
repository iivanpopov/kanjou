# Translating MF2 messages

## Translate vs. keep verbatim

| Translate                                                        | Keep verbatim                                                                                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Plain text outside `{ }` (**simple message**)                    | Anything inside single `{ }`: `$var`, `:func`, `option=value`                                                                                 |
| Plain text inside `{{ }}` (**complex message**), excluding `{ }` | **Markup** (`{#bold}`, `{/bold}`, `{#icon/}`)                                                                                                 |
| Text between markup tags (`{#bold}bold text{/bold}`)             | Declaration lines (`.local`, `.input`)                                                                                                        |
|                                                                  | Code-like literals (`\|2024-05-01T15:04:06\|` in options); translate text literals (`{\|John Doe\|}`) only when developer intent calls for it |

Example: `It is {$today :datetime dateFields=year-month-day dateLength=long timePrecision=minute} today.` -> translate only `It is ` and ` today.`.

## Rules

- Move placeholders (`{$name}`) with their `{ }` braces to match target grammar: `Hello, {$name}!` -> `{$name}, hello!`.
- In a **complex message**, translate only text inside `{{ }}`.
- Escape literal `{`, `}`, `\` in text as `\{`, `\}`, `\\`.

## Matchers

Translate existing **variants** and add or remove variants to match the target language's CLDR plural categories while keeping the **all-`*` fallback**.

English -> Czech:

```
.input {$numDays :number}
.match $numDays
one  {{{$numDays} den}}
few  {{{$numDays} dny}}
many {{{$numDays} dne}}
*    {{{$numDays} dní}}
```

## Declarations

Keep `.local`/`.input` lines verbatim; translate only the pattern inside `{{ }}`:

```
.local $x = {|This is an expression|}
.input {$now :date fields=year-month-day length=long}
{{{$x} from {$now}}}
```
