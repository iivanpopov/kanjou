import type { ConfigInput } from '@kanjou/generator'
import type { UnpluginFactory, UnpluginInstance } from 'unplugin'

import { CONFIG_FILENAME, Generator, getConfig, readLocaleFiles } from '@kanjou/generator'
import path from 'node:path'
import { createUnplugin } from 'unplugin'

import { load } from '#/shared/load'
import { basename } from '#/shared/path'

export const kanjouPluginFactory: UnpluginFactory<ConfigInput | undefined> = (options) => {
  let config = getConfig(options)

  let generator = new Generator(config)

  return {
    name: 'kanjou',

    async buildStart() {
      const configFilePath = path.resolve(CONFIG_FILENAME)
      this.addWatchFile(configFilePath)

      const localeFiles = await readLocaleFiles(config.localesDir)
      localeFiles.forEach((file) => this.addWatchFile(file.absolute))

      await generator.generate()
    },

    resolveId(id) {
      if (id.startsWith('virtual:kanjou/')) return '\0' + id
    },

    async load(id) {
      if (!id.startsWith('\0virtual:kanjou/')) return

      const localeFiles = await readLocaleFiles(config.localesDir)

      if (id === '\0virtual:kanjou/locales') {
        return generator.virtualLocalesToString(localeFiles.map((file) => file.name))
      }

      const [, locale] = id.split('/')
      const localeFile = localeFiles.find((file) => file.name === locale)

      if (!localeFile) return this.error(`file for locale "${locale}" not found.`)

      this.addWatchFile(localeFile.absolute)

      const messages = await load(localeFile)
      const ast = generator.ast(messages)
      return generator.astToString(ast)
    },

    async watchChange(id, change) {
      if (config.dts === false) return

      if (id.includes(CONFIG_FILENAME)) {
        config = getConfig(options)
        generator = new Generator(config)
        await generator.generate()
        return
      }

      if (change.event === 'update' && basename(id) === config.baseLocale) {
        await generator.generate()
      }
    },
  }
}

export const kanjou: UnpluginInstance<ConfigInput | undefined, false> =
  createUnplugin(kanjouPluginFactory)
