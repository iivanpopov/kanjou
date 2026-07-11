import type { UserConfig } from '@kanjou/config'
import type { ModuleNode, Plugin } from 'vite'

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

      if (file !== normalizePath(path.resolve(config.sourceLocalePath))) return

      if (config.dts) await generateLocalesDts(config)

      const fileName = path.basename(file, path.extname(file))

      const mods = [
        server.moduleGraph.getModuleById(`\0virtual:kanjou/${fileName}`),
        server.moduleGraph.getModuleById('\0virtual:kanjou/modules'),
      ].filter(Boolean) as ModuleNode[]

      for (const mod of mods) server.moduleGraph.invalidateModule(mod)

      return mods
    },
    async buildStart() {
      const config = await ctx.getConfig()

      if (!config.dts) return

      this.addWatchFile(config.sourceLocalePath)

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
