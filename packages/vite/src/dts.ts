import consola from 'consola'
import fs from 'node:fs/promises'
import path from 'node:path'

export interface DtsOptions {
  sourceLocalePath: string
  outputDirectory: string
}

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

    await fs.writeFile(path.resolve(outputDirectory, 'locales.d.ts'), content)
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate locales.d.ts', error)
  }
}

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

    await fs.writeFile(path.resolve(outputDirectory, 'virtual.d.ts'), content)
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate virtual.d.ts', error)
  }
}

export async function generateLocaleDts({ outputDirectory, sourceLocalePath }: DtsOptions) {
  try {
    const jsonRaw = await fs.readFile(sourceLocalePath)!
    const messagesRaw = jsonRaw.toString()

    await fs.writeFile(
      path.resolve(outputDirectory, 'messages.d.ts'),
      `/* eslint-disable */\nexport {}\ndeclare module '@kanjou/react' {\n  export interface Messages  ${messagesRaw}}`,
    )
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate messages.d.ts', error)
  }
}
