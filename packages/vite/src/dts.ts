import type { UserConfig } from '@kanjou/config'

import consola from 'consola'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function generateLocalesDts(config: UserConfig) {
  if (!config.dts?.outputDirectory && !config.dts?.localesDtsOutputPath) return

  const localesDtsOutputPath = config.dts.outputDirectory
    ? path.resolve(config.dts.outputDirectory, 'locales.d.ts')
    : path.resolve(config.dts.localesDtsOutputPath!) // we must have it here

  try {
    const localeFilesDir = path.dirname(config.sourceLocalePath)
    const localeFiles = await fs.readdir(localeFilesDir)
    const locales = localeFiles
      .map((file) => `    ${path.basename(file, '.json')}: true`)
      .join('\n')

    const jsonRaw = await fs.readFile(config.sourceLocalePath)
    const messages = jsonRaw.toString().trim()

    const content = `/* eslint-disable */
export {}
declare module '@kanjou/react' {
  export interface Locales {
${locales}
  }
  export interface Messages ${messages}
}`

    await fs.mkdir(path.dirname(localesDtsOutputPath), { recursive: true })
    await fs.writeFile(localesDtsOutputPath, content)
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate locales.d.ts', error)
  }
}

const virtualDtsContent = `/* eslint-disable */
declare module 'virtual:kanjou/*' {
  const messages: Partial<import('@kanjou/react').Messages>
  export default messages
}

declare module 'virtual:kanjou/modules' {
  const modules: Record<import('@kanjou/react').Locale, () => Promise<{ default: Record<string, any> }>>
  export default modules
}`

export async function generateVirtualDts(config: UserConfig) {
  if (!config.dts?.outputDirectory && !config.dts?.virtualDtsOutputPath) return

  const virtualDtsOutputPath = config.dts.outputDirectory
    ? path.resolve(config.dts.outputDirectory, 'virtual.d.ts')
    : path.resolve(config.dts.virtualDtsOutputPath!) // we must have it here

  try {
    await fs.mkdir(path.dirname(virtualDtsOutputPath), { recursive: true })
    await fs.writeFile(virtualDtsOutputPath, virtualDtsContent)
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate virtual.d.ts', error)
  }
}
