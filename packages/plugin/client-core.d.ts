declare module 'virtual:kanjou/*' {
  const messages: Readonly<Record<string, import('@kanjou/core').Message>>
  export default messages
}

declare module 'virtual:kanjou/locales' {
  const locales: Record<
    import('@kanjou/core').Locale,
    () => Promise<Readonly<Record<string, import('@kanjou/core').Message>>>
  >
  export default locales
}

declare module 'virtual:kanjou/namespaces' {
  const namespaces: Record<
    import('@kanjou/core').Locale,
    Record<
      import('@kanjou/core').Namespace,
      () => Promise<Readonly<Record<string, import('@kanjou/core').Message>>>
    >
  >
  export default namespaces
}

declare module 'virtual:kanjou/functions' {
  const functions: Partial<import('@kanjou/core').Functions>
  export default functions
}
