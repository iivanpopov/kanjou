import type { ConfigInput } from '@kanjou/generator'
import type { UnpluginFactory, UnpluginInstance } from 'unplugin'

import { CONFIG_FILENAME, Generator, getConfig } from '@kanjou/generator'
import path from 'node:path'
import { createUnplugin } from 'unplugin'

export { KanjouPluginError } from './errors'
export type { KanjouPluginErrorOptions } from './errors'

const VIRTUAL_PREFIX = 'virtual:kanjou/'
const RESOLVED_PREFIX = '\0' + VIRTUAL_PREFIX

export const kanjouPluginFactory: UnpluginFactory<ConfigInput | undefined> = (options) => {
  const configFilePath = path.resolve(CONFIG_FILENAME)
  let config = getConfig(options)
  let generator = new Generator(config)

  return {
    name: 'kanjou',
    enforce: 'pre',

    async buildStart() {
      this.addWatchFile(configFilePath)
      if (config.dts !== false) {
        await generator.emitDts()
      }
    },

    resolveId(id) {
      if (id.startsWith(VIRTUAL_PREFIX)) {
        return '\0' + id
      }
    },

    async load(id) {
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

      if (path.resolve(id) === configFilePath) {
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
