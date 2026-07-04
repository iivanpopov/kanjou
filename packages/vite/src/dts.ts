import consola from 'consola'
import fs from 'node:fs/promises'
import path from 'node:path'

export interface DtsOptions {
  sourceLocalePath: string
  outputDirectory: string
}

const LOCALES_DTS_FILENAME = 'locales.d.ts'

export async function generateLocalesDts({ outputDirectory, sourceLocalePath }: DtsOptions) {
  try {
    const localeFilesDir = path.dirname(sourceLocalePath)
    const localeFiles = await fs.readdir(localeFilesDir)
    const locales = localeFiles.map((file) => path.basename(file, '.json'))
    const localesBlock = locales.map((locale) => `    ${locale}: true`).join('\n')

    const content = `/* eslint-disable */
export {}
declare module '@kanjou/react' {
  export interface Locales {
${localesBlock}
  }
}`

    await fs.writeFile(path.resolve(outputDirectory, LOCALES_DTS_FILENAME), content)
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate locales.d.ts', error)
  }
}

const VIRTUAL_DTS_FILENAME = 'virtual.d.ts'

export async function generateVirtualDts({ outputDirectory }: DtsOptions) {
  try {
    const content = `/* eslint-disable */
declare module 'virtual:kanjou/*' {
  const messages: Partial<import('@kanjou/react').Messages>
  export default messages
}

declare module 'virtual:kanjou/modules' {
  const localeModules: Record<
    import('@kanjou/react').Locale,
    () => Promise<{ default: Record<string, any> }>
  >
  export default localeModules
}`

    await fs.writeFile(path.resolve(outputDirectory, VIRTUAL_DTS_FILENAME), content)
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate virtual.d.ts', error)
  }
}

const MESSAGES_DTS_FILENAME = 'messages.d.ts'

export async function generateMessagesDts({ outputDirectory, sourceLocalePath }: DtsOptions) {
  try {
    const jsonRaw = await fs.readFile(sourceLocalePath)!
    const messagesRaw = jsonRaw.toString()

    await fs.writeFile(
      path.resolve(outputDirectory, MESSAGES_DTS_FILENAME),
      `/* eslint-disable */\nexport {}\ndeclare module '@kanjou/react' {\n  export interface Messages  ${messagesRaw}}`,
    )
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate messages.d.ts', error)
  }
}
