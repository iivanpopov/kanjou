import type { UserConfig } from '@kanjou/config'
import type { Plugin } from 'vite'

import fs from 'node:fs/promises'
import path from 'node:path'
import { normalizePath } from 'vite'

import { createContext } from '#shared/context'

import { generateLocalesDts, generateVirtualDts } from './dts'
import { generateLocaleMessages, generateLocaleModules } from './virtual'

export interface KanjouPluginConfig extends Partial<UserConfig> {}

const DEFAULT_CONFIG: Partial<UserConfig> = {
  dts: {
    outputDirectory: 'generated',
  },
}

export function kanjou(config: KanjouPluginConfig = {}): Plugin {
  const ctx = createContext(DEFAULT_CONFIG, config)

  return {
    name: 'kanjou',
    async handleHotUpdate({ file, server }) {
      const config = await ctx.getConfig()
      const localesDir = normalizePath(path.dirname(config.sourceLocalePath))
      const fileDir = normalizePath(path.dirname(file))

      if (fileDir !== localesDir) return

      const isSourceLocale = file === normalizePath(path.resolve(config.sourceLocalePath))

      if (isSourceLocale && config.dts) await generateLocalesDts(config)

      const mods = []

      const localeName = path.basename(file, path.extname(file))
      const localeModule = server.moduleGraph.getModuleById(`\0virtual:kanjou/${localeName}`)
      if (localeModule) mods.push(localeModule)

      const modulesModule = server.moduleGraph.getModuleById('\0virtual:kanjou/modules')
      if (modulesModule) mods.push(modulesModule)

      return mods
    },
    async buildStart() {
      const config = await ctx.getConfig()

      if (!config.dts) return

      const localeFiles = await fs.readdir(path.dirname(config.sourceLocalePath))

      for (const file of localeFiles)
        this.addWatchFile(path.join(path.dirname(config.sourceLocalePath), file))

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

      const locale = id.split('/')[1]
      return generateLocaleMessages(config.sourceLocalePath, locale)
    },
  }
}
