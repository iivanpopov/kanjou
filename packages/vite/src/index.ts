import type { Plugin } from 'vite'

import consola from 'consola'
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { normalizePath } from 'vite'

import { createContext } from '#shared/context'

import { generateMessagesDts, generateVirtualMessagesDts } from './dts'

const extractParamsRegex = /\{(?<key>[^}]+)\}/g
const isParameterizedRegex = /\{[^}]+\}/

export function kanjou(): Plugin {
  const ctx = createContext({
    sourceLocalePath: 'src/assets/locales/en.json',
    outputDirectory: 'generated',
  })

  return {
    name: 'kanjou',
    async handleHotUpdate({ file }) {
      const config = await ctx.getConfig()

      if (file === normalizePath(path.resolve(config.sourceLocalePath)))
        await generateMessagesDts(config)
    },
    async buildStart() {
      const config = await ctx.getConfig()

      this.addWatchFile(config.sourceLocalePath)

      const outputDirectory = path.resolve(config.outputDirectory)

      if (!existsSync(outputDirectory)) await fs.mkdir(outputDirectory, { recursive: true })

      await generateMessagesDts(config)
      await generateVirtualMessagesDts(outputDirectory)
    },
    resolveId(id) {
      if (id.startsWith('virtual:kanjou/')) return '\0' + id
    },
    async load(id) {
      if (!id.startsWith('\0virtual:kanjou/')) return

      const config = await ctx.getConfig()

      const locale = id.split('/')[1]!
      const localeFilesDir = path.dirname(config.sourceLocalePath)
      const localeFilePath = path.join(localeFilesDir, locale + '.json')

      try {
        const jsonRaw = await fs.readFile(localeFilePath)!
        const messagesRaw: Record<string, string> = JSON.parse(jsonRaw.toString())

        const messages = Object.entries(messagesRaw).map(([key, value]) => {
          key = JSON.stringify(key)

          if (!isParameterizedRegex.test(value)) return `  ${key}: ${JSON.stringify(value)}`

          const template = value.replace(extractParamsRegex, (_, key) => `\${p.${key}}`)

          return `  ${key}: (p = {}) => \`${template}\``
        })

        return `export default {\n${messages.join(',\n')}\n}\n`
      } catch (error) {
        consola.error('[@kanjou/vite] Failed to load locale', error)
      }
    },
  }
}
