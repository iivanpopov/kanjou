import type { UserConfig } from '@kanjou/config'
import type { Plugin } from 'vite'

import fs from 'node:fs/promises'
import path from 'node:path'
import { normalizePath } from 'vite'

import { createContext } from '#shared/context'

import { generateMessagesDts, generateLocalesDts, generateVirtualDts } from './dts'
import { generateLocaleMessages, generateLocaleModules } from './virtual'

export interface KanjouPluginConfig extends Partial<UserConfig> {}

const DEFAULT_CONFIG: UserConfig = {
  sourceLocalePath: 'src/assets/locales/en.json',
  outputDirectory: 'generated',
}

export function kanjou(config: KanjouPluginConfig = {}): Plugin {
  const ctx = createContext(DEFAULT_CONFIG, config)

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

      await fs.mkdir(config.outputDirectory, { recursive: true })

      await generateMessagesDts(config)
      await generateLocalesDts(config)
      await generateVirtualDts(config)
    },
    resolveId(id) {
      if (id.startsWith('virtual:kanjou/')) return '\0' + id
    },
    async load(id) {
      if (!id.startsWith('\0virtual:kanjou/')) return

      const config = await ctx.getConfig()

      if (id === '\0virtual:kanjou/modules') return generateLocaleModules(config.sourceLocalePath)

      const locale = id.split('/')[1]!
      return generateLocaleMessages(config.sourceLocalePath, locale)
    },
  }
}
