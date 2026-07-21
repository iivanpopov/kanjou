import consola from 'consola'
import { parseMessage } from 'messageformat'
import fs from 'node:fs/promises'

import { basenames } from '#/shared/path'

// TODO REFACTOR
// TODO SUPPORT TS FILES
export async function compileAst(localePath: string): Promise<string | undefined> {
  try {
    const messagesRaw = await fs.readFile(localePath, 'utf-8')
    const messages: Record<string, string> = JSON.parse(messagesRaw)

    const astByKey = Object.entries(messages).reduce(
      (acc, [key, value]) => {
        acc[key] = parseMessage(value)
        return acc
      },
      {} as Record<string, any>,
    )

    return JSON.stringify(astByKey)
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to load locale', error)
  }
}

export async function generateLocaleModules(localesDir: string): Promise<string | undefined> {
  try {
    const localeFiles = await fs.readdir(localesDir)
    const locales = basenames(localeFiles, '.json')

    const entries = locales.map(
      (locale) => `  "${locale}": () => import('virtual:kanjou/${locale}')`,
    )

    return `export default {\n${entries.join(',\n')}\n}`
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate locale modules', error)
  }
}
