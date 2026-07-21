import type { UserConfig } from '@kanjou/config'
import type { Plugin } from 'vite'

import fs from 'node:fs/promises'
import path from 'node:path'
import { normalizePath } from 'vite'

import { createContext } from '#/shared/context'

import { generateLocalesDts, generateVirtualDts } from './dts'
import { compileAst, generateLocaleModules } from './virtual'

export function kanjou(config?: UserConfig): Plugin {
  const ctx = createContext(config)

  return {
    name: 'kanjou',
    async handleHotUpdate({ file, server }) {
      const config = await ctx.getConfig()

      const localesDir = normalizePath(path.resolve(path.dirname(config.sourceLocale)))
      const fileDir = normalizePath(path.dirname(file))

      if (fileDir !== localesDir) return

      if (
        file === normalizePath(path.resolve(config.sourceLocale)) &&
        (config.dts?.outDir || config.dts?.localesPath)
      ) {
        generateLocalesDts(config)
      }

      const modules = []

      const localeName = path.basename(file, path.extname(file))
      const localeModule = server.moduleGraph.getModuleById(`\0virtual:kanjou/${localeName}`)
      if (localeModule) modules.push(localeModule)

      const modulesModule = server.moduleGraph.getModuleById('\0virtual:kanjou/locales')
      if (modulesModule) modules.push(modulesModule)

      return modules
    },
    async buildStart() {
      const config = await ctx.getConfig()

      if (!config.dts) return

      const localesDir = path.dirname(config.sourceLocale)
      const localeFiles = await fs.readdir(localesDir)

      localeFiles.forEach((file) => {
        if (file.endsWith('.json')) this.addWatchFile(path.join(localesDir, file))
      })

      if (config.dts.outDir || config.dts.localesPath) generateLocalesDts(config)
      if (config.dts.outDir || config.dts.virtualPath) await generateVirtualDts(config)
    },
    resolveId(id) {
      if (id.startsWith('virtual:kanjou/')) return '\0' + id
    },
    async load(id) {
      if (!id.startsWith('\0virtual:kanjou/')) return

      const config = await ctx.getConfig()

      const localesDir = path.dirname(config.sourceLocale)

      if (id === '\0virtual:kanjou/locales') return generateLocaleModules(localesDir)

      const locale = id.split('/')[1]
      const localePath = path.join(localesDir, `${locale}.json`)

      return compileAst(localePath)
    },
  }
}
