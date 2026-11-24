declare module 'virtual:kanjou/*' {
  const messages: Readonly<Record<string, import('@kanjou/react').Message>>
  export default messages
}

declare module 'virtual:kanjou/locales' {
  const locales: Record<
    import('@kanjou/react').Locale,
    () => Promise<Readonly<Record<string, import('@kanjou/react').Message>>>
  >
  export default locales
}

declare module 'virtual:kanjou/namespaces' {
  const namespaces: Record<
    import('@kanjou/react').Locale,
    Record<
      import('@kanjou/react').Namespace,
      () => Promise<Readonly<Record<string, import('@kanjou/react').Message>>>
    >
  >
  export default namespaces
}
