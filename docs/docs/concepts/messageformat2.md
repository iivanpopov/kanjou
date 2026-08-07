---
title: MessageFormat 2
---

# MessageFormat 2

[MessageFormat 2 (MF2)](https://github.com/unicode-org/message-format-wg) is an upcoming standard for software internationalization developed by the Unicode Consortium. Kanjou relies on MF2 to define and format all localized messages.

## Why MF2 over ICU MessageFormat 1?

If you've used tools like `react-intl`, you're likely familiar with ICU MessageFormat 1. While MF1 has served the industry well, it has several limitations that MF2 aims to solve:

- **Cleaner Syntax**: MF2 introduces a much more readable, structured syntax, avoiding the deeply nested "curly brace hell" of MF1 plurals and selects.
- **Modularity & Data Model**: MF2 is designed with a formal data model, making it easier to parse, analyze, and build tooling around (which is how Kanjou provides strict type safety).
- **First-Class Markup**: MF2 natively supports markup tags, which is perfect for formatting rich text or embedding React components without breaking the flow of translations.
