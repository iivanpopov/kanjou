---
title: 'Philosophy'
---

# Philosophy

This page explains some important decisions and why they were made.

## Feature Set

Internationalization in the front-end should be simple. As a result, **Kanjou** has a limited but complete set of features.

## You Control the State

::: info
Inspired by [react-intl](https://github.com/formatjs/formatjs).
:::

There are several methods to store data. You can save data on the front-end, e.g. in local storage or cookies. It can also be managed on the back-end via a database, file, redis, or another implementation. Therefore, there are multiple ways to manage the state of a React application.

Creating a library that handles every possible approach is inefficient. So **Kanjou** delegates state management and messages[^1] loading to the consumer of the library.

Custom message loading features need to be implemented within your application.

## MessageFormat 2

[MessageFormat 2](https://messageformat.unicode.org) is a Unicode standard for localizable dynamic message strings, designed to make it simple to create natural sounding localized messages.

**MessageFormat 2** was chosen for its simplicity and feature richness. Additionally, **MessageFormat 2** supports [variables](https://messageformat.unicode.org/docs/reference/variables), [markup](https://messageformat.unicode.org/docs/reference/markup) and [functions](https://messageformat.unicode.org/docs/reference/functions).

[^1]: **Messages** — translations, just a string-string object. Or a string-object, if it is [precompiled](./cli.md#compile).
