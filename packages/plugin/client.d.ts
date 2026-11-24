declare module 'virtual:kanjou/*' {
  const messages: Readonly<Record<string, import('@kanjou/react').Message>>
  export default messages
}

declare module 'virtual:kanjou/functions' {
  const removed: 'virtual:kanjou/functions was removed in favour of AOT-compiled built-in functions.'
  export default removed
}

declare module 'virtual:kanjou/locales' {
  const locales: Record<
    import('@kanjou/react').FlatLocale,
    () => Promise<Readonly<Record<string, import('@kanjou/react').Message>>>
  >
  export default locales
}

declare module 'virtual:kanjou/namespaces' {
  const namespaces: {
    readonly [L in keyof import('@kanjou/react').LocaleNamespaces]: Record<
      import('@kanjou/react').LocaleNamespaces[L],
      () => Promise<Readonly<Record<string, import('@kanjou/react').Message>>>
    >
  }
  export default namespaces
}
