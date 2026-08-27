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

Creating a library that handles every possible approach is inefficient. So **Kanjou** delegates state management and messages[^1] loading to the user.

[^1]: **Messages** — translations, just a string-string object. Or a string-object, if it is [precompiled](./cli.md#compile).
