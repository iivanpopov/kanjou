# Matchers (`.match`)

## Anatomy

A matcher selects one **variant** from runtime data:

```
.input {$count :number}
.match $count
one {{You have {$count} week.}}
*   {{You have {$count} weeks.}}
```

- `.match` takes one or more **selector** variables declared earlier with `.input`/`.local`; the selector's function decides how keys match (`:number` defaults to cardinal plural rules).
- Each **variant** pairs one key per selector with a **quoted pattern** `{{...}}`. `*` is the catch-all key matching any value, and at least one **all-`*` fallback** variant is required.
- Evaluation picks the best matching key from the variant list and formats its pattern (`$count = 1` -> `You have 1 week.`; `42` -> `You have 42 weeks.`).

## `:number` / `:integer` selection (`select` option)

| `select`             | Keys matched against       |
| -------------------- | -------------------------- |
| `cardinal` (default) | CLDR cardinal plural rules |
| `ordinal`            | CLDR ordinal plural rules  |
| `exact`              | Exact numeric values       |

Cardinal (default):

```
.input {$num :number}
.match $num
one {{one!}}
*   {{many!}}
```

With `$num = 2` -> `many!`

Ordinal:

```
.input {$num :number select=ordinal}
.match $num
one {{You are {$num}st}}
two {{You are {$num}nd}}
few {{You are {$num}rd}}
*   {{You are {$num}th}}
```

With `$num = 2` -> `You are 2nd`

Exact:

```
.input {$num :number select=exact}
.match $num
1 {{one!}}
2 {{two!}}
3 {{three!}}
* {{other!}}
```

With `$num = 2` -> `two!`

Numeric keys such as `1` match exact values first under `:number`. On Czech (`cs-CZ`), `$num = 2` has cardinal category `few` and matches `few` under `select=cardinal`; under `select=exact` with only `one`/`few`/`*` keys (and no `2` key), it falls through to the **all-`*` fallback** (see [errors.md](errors.md) for invalid key types).

## `:string` selection

Matches exact strings; use `:string` whenever a selector matches literal strings:

```
.input {$operand :string}
.match $operand
1   {{Number 1}}
one {{String "one"}}
*   {{Something else}}
```

With `$operand = "1"` -> `Number 1`

## Multiple selectors

Provide one key per selector in the same order for every variant:

```
.input {$hostGender :string}
.input {$guestCount :number}
.match $hostGender $guestCount
female 0   {{{$hostName} does not host a party.}}
female 1   {{{$hostName} invites {$guestName} to her party.}}
female *   {{{$hostName} invites {$guestCount} people to her party.}}
male   0   {{{$hostName} does not host a party.}}
male   1   {{{$hostName} invites {$guestName} to his party.}}
male   *   {{{$hostName} invites {$guestCount} people to his party.}}
*      0   {{{$hostName} does not host a party.}}
*      1   {{{$hostName} invites {$guestName} to their party.}}
*      *   {{{$hostName} invites {$guestCount} people to their party.}}
```

Key lists are ordered (`one *` and `* one` are distinct). With custom functions, one runtime object can feed multiple selectors:

```
.local $hostGender = {$host :gender}
.local $hostName   = {$host :name}
.input {$guestCount :number}
.match $hostGender $guestCount
female * {{{$hostName} invites {$guestCount} people to her party.}}
*      * {{{$hostName} invites {$guestCount} people to their party.}}
```

## Languages with more than two plural categories

Include every CLDR plural category the target language needs alongside the required **all-`*` fallback** (covers `other`). Example in Polish:

```
.input {$count :number}
.match $count
one  {{Masz {$count} tydzień.}}
few  {{Masz {$count} tygodnie.}}
many {{Masz {$count} tygodni.}}
*    {{Masz {$count} tygodnia.}}
```
