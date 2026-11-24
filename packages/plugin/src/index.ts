import type { ConfigInput } from '@kanjou/generator'
import type { UnpluginFactory, UnpluginInstance } from 'unplugin'

import {
  CONFIG_FILENAME,
  Generator,
  getConfig,
  LOCALE_EXTENSIONS,
  readAllLocales,
} from '@kanjou/generator'
import { existsSync, realpathSync } from 'node:fs'
import path from 'node:path'
import { createUnplugin } from 'unplugin'

import { KanjouPluginError } from './errors'

export { KanjouPluginError } from './errors'
export type { KanjouPluginErrorOptions } from './errors'

const VIRTUAL_PREFIX = 'virtual:kanjou/'
const RESOLVED_PREFIX = '\0' + VIRTUAL_PREFIX
const LOCALES_VIRTUAL_ID = `${RESOLVED_PREFIX}locales`
const NAMESPACES_VIRTUAL_ID = `${RESOLVED_PREFIX}namespaces`

interface ViteModuleGraphLike<TNode = object> {
  getModuleById(id: string): TNode | undefined
  invalidateModule(mod: TNode): void
}

interface ViteDevServerLike {
  environments?: Record<string, { moduleGraph: ViteModuleGraphLike }> | undefined
  moduleGraph?: ViteModuleGraphLike | undefined
  watcher?: { add(paths: string | readonly string[]): void } | undefined
}

function toRealPath(targetPath: string): string {
  const resolved = path.resolve(targetPath)
  try {
    return realpathSync(resolved)
  } catch {
    return resolved
  }
}

function isInsideDir(parentDir: string, filePath: string): boolean {
  const rel = path.relative(parentDir, filePath)
  if (rel === '') return true
  if (rel === '..' || rel.startsWith('../') || rel.startsWith('..\\')) return false
  return !path.isAbsolute(rel)
}

function stripVirtualQuery(target: string): string {
  const q = target.indexOf('?')
  return q === -1 ? target : target.slice(0, q)
}

function isDeclarationFile(fileName: string): boolean {
  return fileName.endsWith('.d.ts') || fileName.endsWith('.d.mts') || fileName.endsWith('.d.cts')
}

function isLocaleSourceFile(fileName: string): boolean {
  return !isDeclarationFile(fileName) && LOCALE_EXTENSIONS.has(path.extname(fileName))
}

function extractLocaleFromRelative(relPath: string): string {
  const normalized = relPath.replaceAll('\\', '/')
  const slashIndex = normalized.indexOf('/')
  if (slashIndex !== -1) {
    return normalized.slice(0, slashIndex)
  }
  return path.parse(relPath).name
}

function invalidateGraphModules<TNode>(
  graph: ViteModuleGraphLike<TNode>,
  virtualIds: readonly string[],
): void {
  for (const vid of virtualIds) {
    const mod = graph.getModuleById(vid)
    if (mod !== undefined) {
      graph.invalidateModule(mod)
    }
  }
}

export const kanjouPluginFactory: UnpluginFactory<ConfigInput | undefined, false> = (options) => {
  let rootDir = process.cwd()
  let configFilePath = path.resolve(rootDir, CONFIG_FILENAME)
  let config = getConfig(options, rootDir)
  let generator = new Generator(config)
  let realLocalesDir = toRealPath(config.localesDir)
  const virtualDeps = new Map<string, Set<string>>()
  let knownLocaleFiles = new Set<string>()
  let viteServer: ViteDevServerLike | undefined

  function reloadConfig(nextRootDir: string): void {
    rootDir = path.resolve(nextRootDir)
    configFilePath = path.resolve(rootDir, CONFIG_FILENAME)
    config = getConfig(options, rootDir)
    generator = new Generator(config)
    realLocalesDir = toRealPath(config.localesDir)
    if (viteServer?.watcher) {
      viteServer.watcher.add(realLocalesDir)
    }
  }

  async function syncKnownFiles(): Promise<void> {
    try {
      const { localeFiles, localeNamespaces } = await readAllLocales(config.localesDir)
      const next = new Set<string>()
      for (const file of localeFiles) {
        next.add(toRealPath(file.absolute))
      }
      for (const files of Object.values(localeNamespaces)) {
        for (const file of files) {
          next.add(toRealPath(file.absolute))
        }
      }
      knownLocaleFiles = next
    } catch {
      // Preserve previous knownLocaleFiles if scanning locales fails
    }
  }

  function collectAffectedVirtualIds(
    changedRealPath: string,
    isConfig: boolean,
    isStructural: boolean,
  ): string[] {
    if (isConfig) return [...virtualDeps.keys()]

    const changedLocaleVid = isInsideDir(realLocalesDir, changedRealPath)
      ? `${RESOLVED_PREFIX}${extractLocaleFromRelative(path.relative(realLocalesDir, changedRealPath))}`
      : undefined

    const affected: string[] = []
    for (const [vid, deps] of virtualDeps) {
      const baseVid = stripVirtualQuery(vid)
      if (
        deps.has(changedRealPath) ||
        (isStructural && (baseVid === LOCALES_VIRTUAL_ID || baseVid === NAMESPACES_VIRTUAL_ID)) ||
        (changedLocaleVid !== undefined && baseVid === changedLocaleVid)
      ) {
        affected.push(vid)
      }
    }
    return affected
  }

  function invalidateViteModules(virtualIds: readonly string[]): void {
    if (!viteServer || virtualIds.length === 0) return

    if (viteServer.environments) {
      for (const env of Object.values(viteServer.environments)) {
        invalidateGraphModules(env.moduleGraph, virtualIds)
      }
      return
    }

    if (viteServer.moduleGraph) {
      invalidateGraphModules(viteServer.moduleGraph, virtualIds)
    }
  }

  return {
    name: 'kanjou',
    enforce: 'pre',

    async buildStart() {
      this.addWatchFile(configFilePath)
      this.addWatchFile(realLocalesDir)
      await syncKnownFiles()
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

      const rawTarget = id.slice(RESOLVED_PREFIX.length)
      let target = rawTarget
      let mod = await generator.virtual(target)
      if (!mod && rawTarget.includes('?')) {
        target = stripVirtualQuery(rawTarget)
        mod = await generator.virtual(target)
      }

      if (!mod) {
        if (target === 'functions' || target.startsWith('fn/')) {
          throw new KanjouPluginError(
            `Virtual module "${VIRTUAL_PREFIX}${target}" was removed in favour of AOT-compiled built-in functions.`,
            { virtualId: `${VIRTUAL_PREFIX}${target}` },
          )
        }
        return this.error(`file for locale "${target}" not found.`)
      }

      const baseVirtualId = RESOLVED_PREFIX + target
      const realDeps = new Set<string>()
      for (const file of mod.watchFiles) {
        const realFile = toRealPath(file)
        realDeps.add(realFile)
        this.addWatchFile(realFile)
      }
      virtualDeps.set(baseVirtualId, realDeps)
      if (id !== baseVirtualId) {
        virtualDeps.set(id, realDeps)
      }

      return mod.code
    },

    async watchChange(id, change) {
      if (isDeclarationFile(id)) return

      const realId = toRealPath(id)
      if (realId === toRealPath(configFilePath)) {
        const prevIds = [...virtualDeps.keys()]
        reloadConfig(rootDir)
        await syncKnownFiles()
        invalidateViteModules(prevIds)
        if (config.dts !== false) {
          await generator.emitDts()
        }
        return
      }

      realLocalesDir = toRealPath(config.localesDir)
      if (!isInsideDir(realLocalesDir, realId)) return
      if (path.extname(realId) !== '' && !isLocaleSourceFile(realId)) return

      const rel = path.relative(realLocalesDir, realId)
      const event = change?.event
      const isStructural =
        event === 'create' ||
        event === 'delete' ||
        (isLocaleSourceFile(realId) && (!knownLocaleFiles.has(realId) || !existsSync(realId)))

      if (!isLocaleSourceFile(realId) && !isStructural) return

      invalidateViteModules(collectAffectedVirtualIds(realId, false, isStructural))

      if (isStructural) {
        await syncKnownFiles()
      }

      if (config.dts === false) return
      if (isStructural || extractLocaleFromRelative(rel) === config.baseLocale) {
        await generator.emitDts()
      }
    },

    vite: {
      configResolved(resolvedConfig) {
        if (resolvedConfig.root && path.resolve(resolvedConfig.root) !== rootDir) {
          reloadConfig(resolvedConfig.root)
        }
      },

      configureServer(server) {
        viteServer = server
        const realRoot = toRealPath(rootDir)
        if (
          !isInsideDir(realRoot, realLocalesDir) ||
          realLocalesDir !== path.resolve(config.localesDir)
        ) {
          server.watcher?.add(realLocalesDir)
        }
      },

      async hotUpdate({ file, modules }) {
        const realFile = toRealPath(file)
        let affectedIds: string[] | undefined

        if (realFile === toRealPath(configFilePath)) {
          affectedIds = [...virtualDeps.keys()]
          reloadConfig(rootDir)
          await syncKnownFiles()
        } else if (isInsideDir(realLocalesDir, realFile) && isLocaleSourceFile(realFile)) {
          const isStructural = !knownLocaleFiles.has(realFile) || !existsSync(realFile)
          affectedIds = collectAffectedVirtualIds(realFile, false, isStructural)
        }

        if (!affectedIds || affectedIds.length === 0) return

        const extra: typeof modules = []
        for (const vid of affectedIds) {
          const mod = this.environment.moduleGraph.getModuleById(vid)
          if (mod && !modules.includes(mod) && !extra.includes(mod)) {
            this.environment.moduleGraph.invalidateModule(mod)
            extra.push(mod)
          }
        }

        return [...modules, ...extra]
      },
    },

    webpack(compiler) {
      const context = compiler.options?.context
      if (typeof context === 'string' && path.resolve(context) !== rootDir) {
        reloadConfig(context)
      }
    },
  }
}

export const kanjou: UnpluginInstance<ConfigInput | undefined, false> =
  createUnplugin(kanjouPluginFactory)
