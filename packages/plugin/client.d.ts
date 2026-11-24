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

declare module 'virtual:kanjou/functions' {
  const functions: Partial<import('@kanjou/react').Functions>
  export default functions
}

declare module 'virtual:kanjou/fn/number.js' {
  export const number: import('@kanjou/react').Functions['number']
  export const integer: import('@kanjou/react').Functions['integer']
}

declare module 'virtual:kanjou/fn/offset.js' {
  export const offset: import('@kanjou/react').Functions['offset']
}

declare module 'virtual:kanjou/fn/string.js' {
  export const string: import('@kanjou/react').Functions['string']
}
