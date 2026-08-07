---
title: Why Kanjou?
---

# Why Kanjou?

With mature solutions like `i18next` and `react-intl` already available, you might wonder why we need another internationalization (i18n) library. Kanjou was built to address the limitations of these existing tools by embracing modern standards and focusing deeply on developer experience.

## The Problem with Existing Solutions

While powerful, traditional i18n libraries come with a few notable drawbacks:

- **`i18next`**: It's highly extensible but often relies on proprietary string interpolation formats and can feel bloated for modern, lightweight apps. Type safety requires complex configuration.
- **`react-intl`**: It uses ICU MessageFormat 1, which has a clunky syntax (especially for nested plurals and selects) and wasn't originally designed for the web or embedding React components seamlessly.
- **Lack of true End-to-End Type Safety**: Keeping translation files perfectly in sync with component usage is notoriously difficult. Often, typos in translation keys or missing variables only surface at runtime.

## What Kanjou Does Differently

Kanjou is a next-generation React i18n library designed with modern workflows in mind:

1. **MessageFormat 2 (MF2)**: Kanjou is built from the ground up to support the upcoming Unicode MessageFormat 2 standard. This means a cleaner, more readable syntax, better plural/gender support, and an easier path for translators.
2. **End-to-End Type Safety**: Using the `@kanjou/cli`, Kanjou analyzes your locale files and generates TypeScript definitions. This guarantees 100% type safety—down to the specific variables expected by each translation string.
3. **Seamless React Embedding**: Through MF2's markup syntax (`{#tagName}`), Kanjou makes it incredibly easy to embed complex React components (like links or styled spans) directly into your localized strings.

:::info
Kanjou is currently optimized and built exclusively for **React** environments (including Next.js and Vite). Support for other frameworks like Vue, Svelte, or Solid is not available at this time.
:::
