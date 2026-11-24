import type { ConfigInput } from '@kanjou/generator'
import type { UnpluginFactory, UnpluginInstance } from 'unplugin'

import { CONFIG_FILENAME, Generator, getConfig } from '@kanjou/generator'
import path from 'node:path'
import { createUnplugin } from 'unplugin'

import { loadMessageFormatModule, resolveMessageFormatId } from './messageformat'

const VIRTUAL_PREFIX = 'virtual:kanjou/'
const RESOLVED_PREFIX = '\0' + VIRTUAL_PREFIX

export const kanjouPluginFactory: UnpluginFactory<ConfigInput | undefined> = (options) => {
  let config = getConfig(options)
  let generator = new Generator(config)

  return {
    name: 'kanjou',
    enforce: 'pre',

    async buildStart() {
      this.addWatchFile(path.resolve(CONFIG_FILENAME))
      if (config.dts !== false) {
        await generator.emitDts()
      }
    },

    resolveId(id, importer) {
      const resolved = resolveMessageFormatId(id, importer)
      if (resolved !== undefined) return resolved

      if (id.startsWith(VIRTUAL_PREFIX)) {
        return '\0' + id
      }
    },

    async load(id) {
      const loaded = loadMessageFormatModule(id)
      if (loaded !== undefined) return loaded

      if (!id.startsWith(RESOLVED_PREFIX)) return

      const target = id.slice(RESOLVED_PREFIX.length)
      const module = await generator.virtual(target)

      if (!module) {
        return this.error(`file for locale "${target}" not found.`)
      }

      module.watchFiles.forEach((file) => this.addWatchFile(file))
      return module.code
    },

    async watchChange(id) {
      if (id.endsWith('.d.ts')) return

      if (id.endsWith(CONFIG_FILENAME)) {
        config = getConfig(options)
        generator = new Generator(config)
        if (config.dts !== false) {
          await generator.emitDts()
        }
        return
      }

      if (config.dts === false) return

      const localesDir = path.resolve(config.localesDir)
      if (id === localesDir || id.startsWith(localesDir + path.sep)) await generator.emitDts()
    },
  }
}

export const kanjou: UnpluginInstance<ConfigInput | undefined, false> =
  createUnplugin(kanjouPluginFactory)
