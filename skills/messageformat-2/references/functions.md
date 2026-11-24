# MF2 functions reference (LDML 48)

## Required built-in functions

### `:number` and `:integer` (formatters and selectors)

`:integer` rounds its numeric operand to an integer (`{3.14 :integer}` -> `3`). Options marked "`:number` only" apply only to `:number`. `select` must be a literal value.

| Option                     | Allowed values                                                                                     | Default      | `:integer`? |
| -------------------------- | -------------------------------------------------------------------------------------------------- | ------------ | ----------- |
| `select`                   | `cardinal`, `ordinal`, `exact`                                                                     | `cardinal`   | yes         |
| `minimumIntegerDigits`     | positive integer                                                                                   | `1`          | yes         |
| `minimumFractionDigits`    | positive integer                                                                                   | none         | no          |
| `maximumFractionDigits`    | positive integer                                                                                   | none         | no          |
| `minimumSignificantDigits` | positive integer                                                                                   | none         | no          |
| `maximumSignificantDigits` | positive integer                                                                                   | none         | yes         |
| `roundingIncrement`        | `1`, `2`, `5`, `10`, `20`, `25`, `50`, `100`, `200`, `250`, `500`, `1000`, `2000`, `2500`, `5000`  | `1`          | no          |
| `roundingMode`             | `ceil`, `floor`, `expand`, `trunc`, `halfCeil`, `halfFloor`, `halfExpand`, `halfTrunc`, `halfEven` | `halfExpand` | no          |
| `roundingPriority`         | `auto`, `morePrecision`, `lessPrecision`                                                           | `auto`       | no          |
| `signDisplay`              | `auto`, `always`, `exceptZero`, `negative`, `never`                                                | `auto`       | yes         |
| `trailingZeroDisplay`      | `auto`, `stripIfInteger`                                                                           | `auto`       | no          |
| `useGrouping`              | `auto`, `always`, `never`, `min2`                                                                  | `auto`       | yes         |

Examples (`en-US`, `$num = 3.1415927`):

- `{$num :number minimumIntegerDigits=4 minimumFractionDigits=4}` -> `0,003.1416`
- `{$num :number maximumSignificantDigits=6}` -> `3.14159`
- `{3.14 :integer}` -> `3`
- `{-0 :number signDisplay=exceptZero}` -> `0`

### `:offset` (formatter and selector)

Adds or subtracts an integer delta from a numeric operand before formatting and selection. Provide exactly one of `add` or `subtract` (integer >= 0):

```
.input {$count :offset subtract=1}
.match $count
0   {{Only you}}
one {{You and 1 other}}
*   {{You and {$count} others}}
```

With `$count = 3` -> `You and 2 others`

### `:string` (formatter and selector)

Formats stringifiable values and selects by exact string match. Accepts no options (see [matchers.md](matchers.md)).

## Draft standard functions

Draft functions require explicit registration in some implementations (for example `DraftFunctions` from `messageformat/functions` in JS). Unregistered functions raise `unknown-function`.

### `:percent` (formatter and selector)

Formats and selects percent values (`0.42` -> `42%`). Accepts `minimumFractionDigits`, `maximumFractionDigits`, `minimumSignificantDigits`, `maximumSignificantDigits`, `roundingMode`, `roundingPriority`, `signDisplay`, `trailingZeroDisplay`, `useGrouping`.

- `{$score :percent}` with `0.42` -> `42%`

### `:currency` (formatter only)

Formats monetary amounts; requires a `currency` ISO 4217 code option (or object operand property). Accepts `currency`, `currencyDisplay` (`code`, `symbol`, `narrowSymbol`, `name`), `currencySign` (`standard`, `accounting`), `fractionDigits` (`auto` or integer >= 0), `minimumIntegerDigits`, `minimumSignificantDigits`, `maximumSignificantDigits`, `roundingIncrement`, `roundingMode`, `roundingPriority`, `trailingZeroDisplay`, `useGrouping`.

- `{42 :currency currency=$currency}` with `currency = "USD"` -> `$42.00`

### `:unit` (formatter only)

Formats unit quantities; requires a `unit` CLDR unit identifier option (or object operand property). Accepts `unit`, `unitDisplay` (`long`, `short`, `narrow`), plus the `:number` digit, rounding, `signDisplay`, and `useGrouping` options.

- `{5 :unit unit=kilometer unitDisplay=long}` -> `5 kilometers`

### `:datetime`, `:date`, `:time` (formatters only)

Accept an ISO 8601 string (e.g. `2024-05-01T15:04:06`), timestamp, or `Date` object.

| Function                      | Options                | Allowed values                                                                                                   |
| ----------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `:datetime`                   | `dateFields`           | `weekday`, `day-weekday`, `month-day`, `month-day-weekday`, `year-month-day` (default), `year-month-day-weekday` |
| `:datetime`                   | `dateLength`           | `long`, `medium`, `short`                                                                                        |
| `:datetime`                   | `timePrecision`        | `hour`, `minute` (default), `second`                                                                             |
| `:datetime`, `:time`          | `timeZoneStyle`        | `long`, `short`                                                                                                  |
| `:datetime`, `:time`          | `hour12`               | `true`, `false`                                                                                                  |
| `:datetime`, `:date`, `:time` | `calendar`, `timeZone` | Unicode calendar id / IANA zone or `input`                                                                       |
| `:date`                       | `fields`, `length`     | Same values as `dateFields`, `dateLength`                                                                        |
| `:time`                       | `precision`            | Same values as `timePrecision`                                                                                   |

Examples (`en-US`, `$date = "2024-05-01T15:04:06"`):

```
Today is {$date :datetime dateFields=year-month-day-weekday dateLength=long timePrecision=minute}.
The date is {$date :date fields=year-month-day length=short}.
The time is {$date :time precision=second}.
```

-> `Today is Wednesday, May 1, 2024 at 3:04 PM.`, `The date is 5/1/2024.`, `The time is 3:04:06 PM.`

## Custom functions (syntax patterns)

Custom formatters and selectors use the same expression syntax once registered:

```
Check out {MessageFormat :uppercase}.
I know {$languages :list type=AND}.
```

Custom selector with **quoted literals** for keys containing spaces:

```
.local $range = {$name :range}
.match $range
|A - J| {{{$name} is in the first group}}
|J - P| {{{$name} is in the second group}}
|Q - Z| {{{$name} is in the third group}}
*       {{Unreachable}}
```
