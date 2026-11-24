---
name: messageformat-2
description: MessageFormat 2 (MF2) syntax (LDML 48): write, review, translate, or diagnose MF2 messages and errors. Trigger on MF2 mentions or unnamed snippets with `.match`, `.input`/`.local`, `{{...}}` quoted patterns, or `{$var :func}`.
metadata:
  version: '1.0'
---

# MessageFormat 2 (MF2) syntax

## Core rules

1. `{ }` separates code from translatable text; escape `\`, `{`, `}` as `\\`, `\{`, `\}` in text. Whitespace inside patterns is preserved.
2. **Simple message** = bare pattern (`Hello, {$name}!`). Wrap any bare pattern starting with `.` or `{{` in a **quoted pattern** `{{...}}`.
3. **Complex message** = any message with `.input`/`.local` declarations or `.match`; wrap every pattern in `{{...}}`.
4. Code tokens: variables `$name`, functions `:name`, options `name=value` (literal or `$var`), **markup** `{#tag}` `{/tag}` `{#tag/}` (app-defined pass-through tokens without `:`).
5. Unquoted literals allow letters, digits, `_`, `-`, `.`, `+` (and Unicode name chars); wrap empty literals or literals with spaces or other punctuation in **quoted literals** `|...|` (escaping `\\`, `\|`).
6. Declare each variable once, before any reference. Referencing an undeclared `$var` implicitly declares it, making a later `.local` with that name a duplicate. `.input {$x}` without a function only documents `$x`.
7. Every `.match` **selector** requires a selectable function (`:number`, `:integer`, `:offset`, `:string`, `:percent`, or custom) via `.input`/`.local`; every **variant** has one key per selector, unique key lists, and an **all-`*` fallback**.
8. Formatted outputs vary by locale and implementation; present sample results as illustrative.

## References

Load only the reference file(s) the task branch needs:

| Task branch                                                               | Reference                                              |
| ------------------------------------------------------------------------- | ------------------------------------------------------ |
| Patterns, text escapes, literals, markup                                  | [references/syntax.md](references/syntax.md)           |
| `$variables`, `.input`, `.local`, shadowing, redeclaration                | [references/variables.md](references/variables.md)     |
| `.match`, cardinal/ordinal/exact selection, multiple selectors            | [references/matchers.md](references/matchers.md)       |
| Built-in and draft functions, exact option names/values, custom functions | [references/functions.md](references/functions.md)     |
| Diagnosing or fixing MF2 errors                                           | [references/errors.md](references/errors.md)           |
| Translating an MF2 message to another locale                              | [references/translators.md](references/translators.md) |

## Workflow

1. Load the reference file(s) matching the task branch (`functions.md` whenever using function options, `errors.md` for error diagnosis, `translators.md` for translation).
2. When authoring or editing: choose **simple message** vs **complex message**. For `.match`, declare every **selector** with `.input`/`.local`, write variants matching selector count, and include an **all-`*` fallback**.
3. Verify the result against the checklist below; fix every failing item and re-check until all items pass.

## Checklist

1. Every `{ }` and `{{ }}` is balanced; every **complex message** wraps all patterns in `{{...}}`.
2. Every variable is declared once, before any reference, without self-reference.
3. Every `.match` **selector** has a selectable function annotation; every **variant** matches selector count with unique key lists and an **all-`*` fallback**.
4. Every function name and option value is verified against [references/functions.md](references/functions.md) (or registered custom functions), with each option appearing at most once.
5. Text escapes (`\\`, `\{`, `\}`) and **quoted literals** (`|...|`) are valid.
6. For translations: code tokens (`$var`, `:func`, options, `{#markup}`) are preserved verbatim and variants match the target locale's CLDR plural categories.

## Example

Input: "Show how many photos a user added, singular/plural."

```
.input {$count :number}
.match $count
one {{You added {$count} photo.}}
*   {{You added {$count} photos.}}
```

Return the final message in a code block. When adding or changing `.match` variants, add one line explaining the chosen variants.
