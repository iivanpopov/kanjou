---
title: 'Philosophy'
---

# Philosophy

This page explains some important decisions and why they were made.

## Feature Set

All genius is simple. And internationalization in front-end might be too. As a result **Kanjou** has limited but _complete_ set of features.

## You Control the State

::: note {no-title}
Inspired by [react-intl](https://github.com/formatjs/formatjs).
:::

There are several methods to store data. You can save data on the front-end, e.g. in the _local storage_ or _cookies_. Also you can do it on the back-end. It could be a _database_, _file_, _redis_, or whatever implementation. Therefore there are multiple ways to manage the state of your React application.

Creating **a library that handles every possible approach** is painful and inefficient. So **Kanjou** delegates state management and loading messages[^1] loading to _you_.

If you want **any** messages loading feature, you need to implement it _yourself_.

## Message Format 2

[MessageFormat 2](https://messageformat.unicode.org) is a Unicode standard for localizable dynamic message strings, designed to make it simple to create natural sounding localized messages.

I've chosen **MF2** for it's simplicity, feature richness. Also **Message Format 2** does support [variables](https://messageformat.unicode.org/docs/reference/variables), [markup](https://messageformat.unicode.org/docs/reference/markup) and [functions](https://messageformat.unicode.org/docs/reference/functions).

```[MF2 Syntax Example]
.input {$count :number}
.match $count
0   {{ No items. }}
one {{ 1 item. }}
*   {{ {$count} items. }}
```

[^1]: **Messages** — translations, just **string-string** object. Or **string-object**, if it is [precompiled](./cli.md#compile).
