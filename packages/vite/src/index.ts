import type { UserConfig } from '@kanjou/config'
import type { Plugin } from 'vite'

import path from 'node:path'
import { normalizePath } from 'vite'

import { compileLocales, compileMessages, writeLocalesDts, writeVirtualDts } from '#/shared/codegen'
import { createContext } from '#/shared/context'
import { basename, basenames, filterLocaleFiles, loadFile, readdir } from '#/shared/io'

export function kanjou(config?: Omit<UserConfig, 'compile'>): Plugin {
  const ctx = createContext(config)

  return {
    name: 'kanjou',
    async handleHotUpdate({ file, server }) {
      const config = await ctx.getConfig()

      const fileDir = normalizePath(path.dirname(file))
      const localesDir = normalizePath(path.resolve(config.localesDir))

      if (fileDir !== localesDir) return

      if (basename(file) === config.baseLocale && config.dts?.locales) {
        const localesPath =
          config.dts.localesPath ?? path.join(config.dts.outDir!, 'locales.kanjou.d.ts')

        await writeLocalesDts(localesPath, config)
      }

      const modules = []

      const locale = basename(file)
      const localeModule = server.moduleGraph.getModuleById(`\0virtual:kanjou/${locale}`)
      if (localeModule) modules.push(localeModule)

      const modulesModule = server.moduleGraph.getModuleById('\0virtual:kanjou/locales')
      if (modulesModule) modules.push(modulesModule)

      return modules
    },
    async buildStart() {
      const config = await ctx.getConfig()

      if (!config.dts) return

      const localeFiles = filterLocaleFiles(await readdir(config.localesDir))

      localeFiles.forEach((file) => this.addWatchFile(file.absolute))

      const localesPath =
        config.dts.localesPath ?? path.join(config.dts.outDir!, 'locales.kanjou.d.ts')
      const virtualPath =
        config.dts.virtualPath ?? path.join(config.dts.outDir!, 'virtual.kanjou.d.ts')

      if (config.dts.locales) await writeLocalesDts(localesPath, config)
      if (config.dts.virtual) await writeVirtualDts(virtualPath, config)
    },
    resolveId(id) {
      if (id.startsWith('virtual:kanjou/')) return '\0' + id
    },
    async load(id) {
      if (!id.startsWith('\0virtual:kanjou/')) return

      const config = await ctx.getConfig()

      const localeFiles = filterLocaleFiles(await readdir(config.localesDir))

      if (id === '\0virtual:kanjou/locales') return compileLocales(basenames(localeFiles))

      const locale = id.split('/')[1]
      const localeFile = localeFiles.find((localeFile) => localeFile.name === locale)
      if (!localeFile) this.error(`failed to load locale "${locale}" - not found`)

      const messages = await loadFile<Record<string, string>>(localeFile)

      return compileMessages(messages ?? {})
    },
  }
}
