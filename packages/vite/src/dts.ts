import type { UserConfig } from '@kanjou/config'

import consola from 'consola'
import fs from 'node:fs/promises'
import path from 'node:path'

export async function generateLocalesDts(config: UserConfig) {
  if (!config.dts?.generate) return

  const localesDtsPath = config.dts.outputDirectory
    ? path.resolve(config.dts.outputDirectory, 'locales.d.ts')
    : path.resolve(config.dts.localesDtsPath!) // we must have it here

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

    await fs.mkdir(path.dirname(localesDtsPath), { recursive: true })
    await fs.writeFile(localesDtsPath, content)
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
  if (!config.dts?.generate) return

  const virtualDtsPath = config.dts.outputDirectory
    ? path.resolve(config.dts.outputDirectory, 'virtual.d.ts')
    : path.resolve(config.dts.virtualDtsPath!) // we must have it here

  try {
    await fs.mkdir(path.dirname(virtualDtsPath), { recursive: true })
    await fs.writeFile(virtualDtsPath, virtualDtsContent)
  } catch (error) {
    consola.error('[@kanjou/vite] Failed to generate virtual.d.ts', error)
  }
}
