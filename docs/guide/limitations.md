---
title: 'Limitations'
---

# Limitations

Every software library involves compromises. This document outlines the known constraints within **Kanjou** to help you plan your application architecture effectively.

## TypeScript Requires Additional Setup

**Kanjou** provides relaxed types by default where keys evaluate as strings and variables evaluate as any. You must manually connect your translation dictionaries to the **Kanjou** type system using the `Register` interface to achieve strict type safety.

Please review the [TypeScript](./typescript.md) documentation for complete setup instructions. This includes configuring automated type generation using the Vite plugin or the command line interface.

## Provider Options Must Be Stable

`KanjouProvider` captures the `options` and `functions` properties exactly once during the initial mount. **Kanjou** ignores any subsequent updates to these properties.

```tsx
// changing options or functions after mount has no effect
<KanjouProvider locale={locale} messages={messages} options={options} functions={fns}>
```

This performance choice was made intentionally. The `options` object relies on an empty dependency array to prevent unnecessary rendering cycles. This behavior might be revisited in future releases.

## Messages Are Not Reactive

`KanjouProvider` recreates its internal context exclusively upon locale changes. Modifying the `messages` property dynamically without altering the active locale does not trigger a render cycle and does not invalidate the existing message cache.

```tsx
// dynamic message updates are not reflected
<KanjouProvider locale="en" messages={dynamicMessages}>
```

## Missing Keys Fall Back to the Key String

**Kanjou** silently returns the exact key string instead of throwing an error when it fails to locate a message identifier inside your dictionaries.

```ts
t('non.existent.key') // returns "non.existent.key"
```

The library currently does not print warnings to the console. There are plans to improve this developer experience soon.

## `defineKanjou` Caches by Locale

The `defineKanjou` function caches returned instances using the locale string as the sole identifier. Calling `createKanjou` with an already initialized locale string returns the exact same cached instance.

You must provide the `messages` property upfront. You need to pass all locale dictionaries at the exact moment of definition.

```ts
export const createKanjou = defineKanjou({
  messages: { en, uk },
})

// first call initializes and caches the instance
createKanjou('en')

// subsequent calls return the cached instance
createKanjou('en')
```

Providing messages at definition prevents the system from serving outdated content across different locales.

## Rich Text Requires a Separate Provider

You must wrap your component tree with `KanjouRichProvider` alongside `KanjouProvider` to use the `KanjouRich` component and the `formatRich` utility. Forgetting this provider step causes runtime context errors.

```tsx
<KanjouProvider locale="en" messages={en}>
  <KanjouRichProvider components={components}>
    <App />
  </KanjouRichProvider>
</KanjouProvider>
```

Not every project requires rich text capabilities. This is split into a separate provider to keep your production bundles as small as possible.
