import type { UserConfig } from '@kanjou/config'
import type { UnpluginFactory, UnpluginInstance } from 'unplugin'

import path from 'node:path'
import { createUnplugin } from 'unplugin'
import { normalizePath } from 'vite'

import { compileLocales, compileMessages, writeLocalesDts, writeVirtualDts } from '#/shared/codegen'
import { createContext } from '#/shared/context'
import { basename, basenames, filterLocaleFiles, loadFile, readdir } from '#/shared/io'

export const kanjouPluginFactory: UnpluginFactory<UserConfig | undefined> = (options) => {
  const ctx = createContext(options)

  return {
    name: 'kanjou',

    async buildStart() {
      const config = await ctx.getConfig()
      const localesDir = config.localesDir ?? './src/assets/locales'
      const baseLocale = config.baseLocale ?? 'en'

      const localeFiles = filterLocaleFiles(await readdir(localesDir))

      localeFiles.forEach((file) => this.addWatchFile(file.absolute))

      if (config.dts !== false) {
        const outDir =
          typeof config.dts === 'object' && config.dts.outDir ? config.dts.outDir : './generated'
        await writeLocalesDts(path.join(outDir, 'locales.kanjou.d.ts'), {
          ...config,
          localesDir,
          baseLocale,
        })
        await writeVirtualDts(path.join(outDir, 'virtual.kanjou.d.ts'), config)
      }
    },

    resolveId(id) {
      if (id.startsWith('virtual:kanjou/')) return '\0' + id
    },

    async load(id) {
      if (!id.startsWith('\0virtual:kanjou/')) return

      const config = await ctx.getConfig()
      const localesDir = config.localesDir ?? './src/assets/locales'

      const localeFiles = filterLocaleFiles(await readdir(localesDir))

      if (id === '\0virtual:kanjou/locales') return compileLocales(basenames(localeFiles))

      const locale = id.replace('\0virtual:kanjou/', '')
      const localeFile = localeFiles.find((localeFile) => localeFile.name === locale)

      if (!localeFile) return

      this.addWatchFile(localeFile.absolute)

      const messages = await loadFile<Record<string, string>>(localeFile)

      return compileMessages(messages ?? {})
    },

    async watchChange(id, change) {
      const config = await ctx.getConfig()
      const localesDir = config.localesDir ?? './src/assets/locales'
      const baseLocale = config.baseLocale ?? 'en'

      const fileDir = normalizePath(path.dirname(id))
      const absoluteLocalesDir = normalizePath(path.resolve(localesDir))

      if (fileDir !== absoluteLocalesDir) return

      if (change.event === 'update' && basename(id) === baseLocale && config.dts !== false) {
        const outDir =
          typeof config.dts === 'object' && config.dts.outDir ? config.dts.outDir : './generated'
        await writeLocalesDts(path.join(outDir, 'locales.kanjou.d.ts'), {
          ...config,
          localesDir,
          baseLocale,
        })
      }

      if ((change.event === 'create' || change.event === 'delete') && config.dts !== false) {
        const outDir =
          typeof config.dts === 'object' && config.dts.outDir ? config.dts.outDir : './generated'
        await writeVirtualDts(path.join(outDir, 'virtual.kanjou.d.ts'), config)
      }
    },
  }
}

export const kanjou: UnpluginInstance<UserConfig | undefined, false> =
  createUnplugin(kanjouPluginFactory)
