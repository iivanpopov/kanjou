declare module 'virtual:kanjou/*' {
  const messages: Partial<import('@kanjou/react').Messages>
  export default messages
}

declare module 'virtual:kanjou/locales' {
  const locales: Record<
    import('@kanjou/react').Locale,
    () => Promise<Record<string, import('@kanjou/react').Message>>
  >
  export default locales
}
