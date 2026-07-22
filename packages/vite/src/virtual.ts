import type { Model } from 'messageformat'

import { parseMessage } from 'messageformat'

export function compileAst(messages: Record<string, string>): string | undefined {
  const ast = Object.entries(messages).reduce(
    (acc, [key, value]) => {
      acc[key] = parseMessage(value)
      return acc
    },
    {} as Record<string, Model.Message>,
  )

  return `export default ${JSON.stringify(ast, null, 2)}`
}

export function compileLocales(locales: string[]): string {
  const entries = locales.map((locale) => `  "${locale}": () => import('virtual:kanjou/${locale}')`)

  return `export default {\n${entries.join(',\n')}\n}`
}
