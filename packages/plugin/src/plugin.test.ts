import type { ConfigInput } from '@kanjou/generator'
import type { UnpluginBuildContext, UnpluginContext, UnpluginOptions } from 'unplugin'

import { Generator } from '@kanjou/generator'
import { KanjouPluginError, kanjouPluginFactory } from '@kanjou/plugin'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { it } from 'node:test'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const REPO_ROOT = path.resolve(import.meta.dirname, '../../..')
const TSC_BIN = path.join(REPO_ROOT, 'node_modules', '.bin', 'tsc')

type ViteHooks = NonNullable<UnpluginOptions['vite']>
type ViteConfigResolvedHook = Extract<ViteHooks['configResolved'], (...args: never[]) => unknown>
type ViteConfigureServerHook = Extract<ViteHooks['configureServer'], (...args: never[]) => unknown>
type ViteHotUpdateHook = Extract<ViteHooks['hotUpdate'], (...args: never[]) => unknown>

type ViteResolvedConfigArg = Parameters<ViteConfigResolvedHook>[0]
type ViteServerArg = Parameters<ViteConfigureServerHook>[0]
type ViteHotUpdateCtx = ThisParameterType<ViteHotUpdateHook>
type ViteHotUpdateArg = Parameters<ViteHotUpdateHook>[0]
type ViteDevEnv = ViteServerArg['environments']['client']
type ViteEnvGraph = ViteDevEnv['moduleGraph']
type ViteEnvModule = NonNullable<ReturnType<ViteEnvGraph['getModuleById']>>
type ViteLegacyGraph = ViteServerArg['moduleGraph']
type ViteLegacyModule = NonNullable<ReturnType<ViteLegacyGraph['getModuleById']>>
type WebpackCompilerArg = Parameters<NonNullable<UnpluginOptions['webpack']>>[0]

function createPartialStub<T>(partial: Partial<T>): T {
  return partial as T
}

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanjou-plugin-test-'))
  try {
    await fn(dir)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
}

interface TestContextResult {
  buildContext: UnpluginBuildContext
  pluginContext: UnpluginBuildContext & UnpluginContext
  watchedFiles: Set<string>
  errors: string[]
}

function createContexts(): TestContextResult {
  const watchedFiles = new Set<string>()
  const errors: string[] = []

  const buildContext: UnpluginBuildContext = {
    addWatchFile(id) {
      watchedFiles.add(id)
    },
    emitFile() {},
    getWatchFiles() {
      return [...watchedFiles]
    },
    parse() {
      throw new Error('parse is not implemented in test stub')
    },
  }

  const pluginContext: UnpluginBuildContext & UnpluginContext = {
    ...buildContext,
    error(message) {
      const text = typeof message === 'string' ? message : message.message
      errors.push(text)
      throw new Error(text)
    },
    warn() {},
  }

  return { buildContext, pluginContext, watchedFiles, errors }
}

function createPlugin(options?: ConfigInput): UnpluginOptions {
  return kanjouPluginFactory(options, { framework: 'vite' })
}

async function callBuildStart(plugin: UnpluginOptions, ctx: UnpluginBuildContext): Promise<void> {
  assert.ok(plugin.buildStart)
  await plugin.buildStart.call(ctx)
}

function callResolveId(
  plugin: UnpluginOptions,
  ctx: UnpluginBuildContext & UnpluginContext,
  id: string,
): unknown {
  assert.ok(plugin.resolveId)
  return plugin.resolveId.call(ctx, id, undefined, { isEntry: false })
}

async function callLoad(
  plugin: UnpluginOptions,
  ctx: UnpluginBuildContext & UnpluginContext,
  id: string,
): Promise<unknown> {
  assert.ok(plugin.load)
  return await plugin.load.call(ctx, id)
}

async function callWatchChange(
  plugin: UnpluginOptions,
  ctx: UnpluginBuildContext,
  id: string,
  event: 'create' | 'update' | 'delete' = 'update',
): Promise<void> {
  assert.ok(plugin.watchChange)
  const result: unknown = plugin.watchChange.call(ctx, id, { event })
  await Promise.resolve(result)
}

async function callViteConfigResolved(plugin: UnpluginOptions, root: string): Promise<void> {
  const hook = plugin.vite?.configResolved
  assert.equal(typeof hook, 'function')
  const configHook = hook as ViteConfigResolvedHook
  await Promise.resolve(
    configHook.call(
      createPartialStub<ThisParameterType<ViteConfigResolvedHook>>({}),
      createPartialStub<ViteResolvedConfigArg>({ root }),
    ),
  )
}

async function callViteConfigureServer(
  plugin: UnpluginOptions,
  server: Partial<ViteServerArg>,
): Promise<void> {
  const hook = plugin.vite?.configureServer
  assert.equal(typeof hook, 'function')
  const configureHook = hook as ViteConfigureServerHook
  await Promise.resolve(
    configureHook.call(
      createPartialStub<ThisParameterType<ViteConfigureServerHook>>({}),
      createPartialStub<ViteServerArg>(server),
    ),
  )
}

function createMockWatcher(added?: string[]): ViteServerArg['watcher'] {
  const watcher: ViteServerArg['watcher'] = createPartialStub<ViteServerArg['watcher']>({
    add(paths: string | readonly string[]): ViteServerArg['watcher'] {
      if (added) {
        if (typeof paths === 'string') added.push(paths)
        else added.push(...paths)
      }
      return watcher
    },
  })
  return watcher
}

function createMockModuleGraph(): {
  graph: ViteEnvGraph
  modules: Map<string, ViteEnvModule>
  invalidatedIds: string[]
} {
  const modules = new Map<string, ViteEnvModule>()
  const invalidatedIds: string[] = []

  const graph = createPartialStub<ViteEnvGraph>({
    getModuleById(id: string) {
      return modules.get(id)
    },
    invalidateModule(mod: ViteEnvModule) {
      if (mod.id) invalidatedIds.push(mod.id)
    },
  })

  return { graph, modules, invalidatedIds }
}

function createMockLegacyGraph(): {
  graph: ViteLegacyGraph
  modules: Map<string, ViteLegacyModule>
  invalidatedIds: string[]
} {
  const modules = new Map<string, ViteLegacyModule>()
  const invalidatedIds: string[] = []

  const graph = createPartialStub<ViteLegacyGraph>({
    getModuleById(id: string) {
      return modules.get(id)
    },
    invalidateModule(mod: ViteLegacyModule) {
      if (mod.id) invalidatedIds.push(mod.id)
    },
  })

  return { graph, modules, invalidatedIds }
}

async function runTscNoEmit(projectDir: string): Promise<{ ok: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execFileAsync(TSC_BIN, [
      '--noEmit',
      '-p',
      path.join(projectDir, 'tsconfig.json'),
    ])
    return { ok: true, output: stdout + stderr }
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'stdout' in err && 'stderr' in err) {
      const execErr = err as { stdout: string; stderr: string }
      return { ok: false, output: execErr.stdout + execErr.stderr }
    }
    throw err
  }
}

async function setupTscProject(projectDir: string): Promise<void> {
  const scopeDir = path.join(projectDir, 'node_modules', '@kanjou')
  await fs.mkdir(scopeDir, { recursive: true })
  await fs.symlink(path.join(REPO_ROOT, 'packages', 'plugin'), path.join(scopeDir, 'plugin'), 'dir')
  await fs.symlink(path.join(REPO_ROOT, 'packages', 'core'), path.join(scopeDir, 'core'), 'dir')
  await fs.symlink(path.join(REPO_ROOT, 'packages', 'react'), path.join(scopeDir, 'react'), 'dir')

  await fs.writeFile(
    path.join(projectDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'esnext',
          module: 'esnext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: [],
        },
        include: ['src/**/*', 'generated/**/*'],
      },
      null,
      2,
    ),
    'utf-8',
  )
}

await it('Should reject virtual:kanjou/functions and virtual:kanjou/fn/* with KanjouPluginError and fail tsc check', async () => {
  await withTempDir(async (dir) => {
    const localesDir = path.join(dir, 'locales')
    await fs.mkdir(localesDir, { recursive: true })
    await fs.writeFile(path.join(localesDir, 'en.ts'), 'export default { hi: "Hi" }', 'utf-8')

    const plugin = createPlugin({ localesDir, dts: false })
    const ctx = createContexts()

    const badIds = [
      '\0virtual:kanjou/functions',
      '\0virtual:kanjou/functions?t=1',
      '\0virtual:kanjou/fn/number',
      '\0virtual:kanjou/fn/date?t=2',
    ]
    await Promise.all(
      badIds.map((badId) =>
        assert.rejects(
          async () => {
            await callLoad(plugin, ctx.pluginContext, badId)
          },
          (err: unknown) => {
            assert.ok(err instanceof KanjouPluginError)
            assert.match(err.message, /removed in favour of AOT-compiled built-in functions/)
            assert.ok(err.virtualId)
            return true
          },
        ),
      ),
    )

    await setupTscProject(dir)
    await fs.mkdir(path.join(dir, 'src'), { recursive: true })
    await fs.writeFile(
      path.join(dir, 'src', 'good.ts'),
      `/// <reference types="@kanjou/plugin/client" />\nimport en from 'virtual:kanjou/en'\nexport const msg = en['hi']\n`,
      'utf-8',
    )
    const goodResult = await runTscNoEmit(dir)
    assert.equal(goodResult.ok, true, goodResult.output)

    await fs.writeFile(
      path.join(dir, 'src', 'bad.ts'),
      `/// <reference types="@kanjou/plugin/client" />\nimport functions from 'virtual:kanjou/functions'\nconst v: Readonly<Record<string, unknown>> = functions\nexport default v\n`,
      'utf-8',
    )

    const result = await runTscNoEmit(dir)
    assert.equal(result.ok, false)
    assert.match(result.output, /TS2322|not assignable to type/)
  })
})

await it('Should resolve query-suffixed virtual ids and invalidate tracked Vite modules on watchChange and hotUpdate', async () => {
  await withTempDir(async (dir) => {
    const localesDir = path.join(dir, 'locales')
    await fs.mkdir(localesDir, { recursive: true })
    const enPath = path.join(localesDir, 'en.ts')
    const configPath = path.join(dir, 'kanjou.config.json')
    await fs.writeFile(enPath, 'export default { hello: "Hello" }', 'utf-8')
    await fs.writeFile(configPath, JSON.stringify({ localesDir: './locales' }), 'utf-8')

    const plugin = createPlugin()
    await callViteConfigResolved(plugin, dir)

    const { graph, modules, invalidatedIds } = createMockModuleGraph()
    const queriedId = '\0virtual:kanjou/en?t=12345'
    const baseId = '\0virtual:kanjou/en'
    const localesId = '\0virtual:kanjou/locales'

    const queriedMod = createPartialStub<ViteEnvModule>({ id: queriedId })
    const baseMod = createPartialStub<ViteEnvModule>({ id: baseId })
    const localesMod = createPartialStub<ViteEnvModule>({ id: localesId })
    modules.set(queriedId, queriedMod)
    modules.set(baseId, baseMod)
    modules.set(localesId, localesMod)

    const env = createPartialStub<ViteDevEnv>({ moduleGraph: graph })
    await callViteConfigureServer(plugin, {
      environments: { client: env, ssr: env },
      watcher: createMockWatcher(),
    })

    const ctx = createContexts()
    await callBuildStart(plugin, ctx.buildContext)

    assert.equal(callResolveId(plugin, ctx.pluginContext, 'virtual:kanjou/en?t=12345'), queriedId)
    const enCode = await callLoad(plugin, ctx.pluginContext, queriedId)
    assert.equal(typeof enCode, 'string')
    assert.match(enCode as string, /"Hello"/)

    await callLoad(plugin, ctx.pluginContext, localesId)

    await callWatchChange(plugin, ctx.buildContext, enPath, 'update')
    assert.ok(invalidatedIds.includes(baseId))
    assert.ok(invalidatedIds.includes(queriedId))

    invalidatedIds.length = 0
    await callWatchChange(plugin, ctx.buildContext, configPath, 'update')
    assert.ok(invalidatedIds.includes(baseId))
    assert.ok(invalidatedIds.includes(localesId))

    invalidatedIds.length = 0
    const hotUpdate = plugin.vite?.hotUpdate
    assert.equal(typeof hotUpdate, 'function')
    const existingMod = createPartialStub<ViteEnvModule>({ id: enPath })
    const hmrResult = await (hotUpdate as ViteHotUpdateHook).call(
      createPartialStub<ViteHotUpdateCtx>({ environment: env }),
      createPartialStub<ViteHotUpdateArg>({ file: enPath, modules: [existingMod] }),
    )
    assert.ok(Array.isArray(hmrResult))
    assert.ok(hmrResult.includes(existingMod))
    assert.ok(hmrResult.includes(baseMod))
    assert.ok(hmrResult.includes(queriedMod))
    assert.ok(invalidatedIds.includes(baseId))

    invalidatedIds.length = 0
    const configHmr = await (hotUpdate as ViteHotUpdateHook).call(
      createPartialStub<ViteHotUpdateCtx>({ environment: env }),
      createPartialStub<ViteHotUpdateArg>({ file: configPath, modules: [] }),
    )
    assert.ok(Array.isArray(configHmr))
    assert.ok(configHmr.includes(localesMod))
    assert.ok(invalidatedIds.includes(localesId))
  })
})

await it('Should invalidate legacy Vite moduleGraph when server.environments is absent', async () => {
  await withTempDir(async (dir) => {
    const localesDir = path.join(dir, 'locales')
    await fs.mkdir(localesDir, { recursive: true })
    const enPath = path.join(localesDir, 'en.ts')
    await fs.writeFile(enPath, 'export default { hello: "Hello" }', 'utf-8')

    const plugin = createPlugin({ localesDir: './locales', dts: false })
    await callViteConfigResolved(plugin, dir)

    const { graph, modules, invalidatedIds } = createMockLegacyGraph()
    const baseId = '\0virtual:kanjou/en'
    modules.set(baseId, createPartialStub<ViteLegacyModule>({ id: baseId }))

    await callViteConfigureServer(plugin, {
      moduleGraph: graph,
      watcher: createMockWatcher(),
    })

    const ctx = createContexts()
    await callBuildStart(plugin, ctx.buildContext)
    await callLoad(plugin, ctx.pluginContext, baseId)
    await callWatchChange(plugin, ctx.buildContext, enPath, 'update')

    assert.deepEqual(invalidatedIds, [baseId])
  })
})

await it('Should resolve config, localesDir, and dts.outDir relative to project root in Vite and Webpack', async () => {
  await withTempDir(async (projectRoot) => {
    await withTempDir(async (otherCwd) => {
      const customLocales = path.join(projectRoot, 'i18n')
      const customDts = path.join(projectRoot, 'types-out')
      await fs.mkdir(customLocales, { recursive: true })
      await fs.writeFile(
        path.join(customLocales, 'en.ts'),
        'export default { title: "Title" }',
        'utf-8',
      )
      await fs.writeFile(
        path.join(projectRoot, 'kanjou.config.json'),
        JSON.stringify({
          localesDir: './i18n',
          dts: { outDir: './types-out' },
        }),
        'utf-8',
      )

      const prevCwd = process.cwd()
      process.chdir(otherCwd)
      try {
        const vitePlugin = createPlugin()
        await callViteConfigResolved(vitePlugin, projectRoot)
        const viteCtx = createContexts()
        await callBuildStart(vitePlugin, viteCtx.buildContext)

        assert.ok(viteCtx.watchedFiles.has(path.join(projectRoot, 'kanjou.config.json')))
        const viteDts = await fs.readFile(path.join(customDts, 'locales.kanjou.d.ts'), 'utf-8')
        assert.match(viteDts, /title/)

        await fs.rm(customDts, { recursive: true, force: true })

        const wpPlugin = createPlugin()
        assert.ok(wpPlugin.webpack)
        wpPlugin.webpack(
          createPartialStub<WebpackCompilerArg>({
            options: createPartialStub<WebpackCompilerArg['options']>({ context: projectRoot }),
          }),
        )
        const wpCtx = createContexts()
        await callBuildStart(wpPlugin, wpCtx.buildContext)

        const wpDts = await fs.readFile(path.join(customDts, 'locales.kanjou.d.ts'), 'utf-8')
        assert.match(wpDts, /title/)
      } finally {
        process.chdir(prevCwd)
      }
    })
  })
})

await it('Should exclude dts.outDir inside localesDir so repeated buildStart runs do not create phantom locales', async (t) => {
  await withTempDir(async (dir) => {
    const localesDir = path.join(dir, 'locales')
    await fs.mkdir(localesDir, { recursive: true })
    await fs.writeFile(path.join(localesDir, 'en.ts'), 'export default { hi: "Hi" }', 'utf-8')

    const plugin = createPlugin({ localesDir, dts: { outDir: localesDir } })
    const ctx = createContexts()

    await callBuildStart(plugin, ctx.buildContext)
    await callBuildStart(plugin, ctx.buildContext)

    const localesCode = (await callLoad(
      plugin,
      ctx.pluginContext,
      '\0virtual:kanjou/locales',
    )) as string
    assert.doesNotMatch(localesCode, /locales\.kanjou/)
    assert.match(localesCode, /"en"/)

    const dts = await fs.readFile(path.join(localesDir, 'locales.kanjou.d.ts'), 'utf-8')
    assert.doesNotMatch(dts, /locales\.kanjou\.d/)

    const emitSpy = t.mock.method(Generator.prototype, 'emitDts', () => Promise.resolve([]))
    await callWatchChange(plugin, ctx.buildContext, path.join(localesDir, 'locales.kanjou.d.ts'))
    await callWatchChange(plugin, ctx.buildContext, path.join(localesDir, 'extra.d.mts'))
    await callWatchChange(plugin, ctx.buildContext, path.join(localesDir, 'extra.d.cts'))
    assert.equal(emitSpy.mock.callCount(), 0)
  })
})

await it('Should trigger emitDts for a symlinked localesDir when a file inside the real target directory changes', async () => {
  await withTempDir(async (dir) => {
    const realLocalesDir = path.join(dir, 'real-locales')
    const linkLocalesDir = path.join(dir, 'locales-link')
    const dtsDir = path.join(dir, 'generated')
    await fs.mkdir(realLocalesDir, { recursive: true })
    await fs.writeFile(
      path.join(realLocalesDir, 'en.ts'),
      'export default { first: "First" }',
      'utf-8',
    )
    await fs.symlink(realLocalesDir, linkLocalesDir, 'dir')

    const plugin = createPlugin({ localesDir: linkLocalesDir, dts: { outDir: dtsDir } })
    await callViteConfigResolved(plugin, dir)
    const ctx = createContexts()
    await callBuildStart(plugin, ctx.buildContext)

    await fs.writeFile(
      path.join(realLocalesDir, 'en.ts'),
      'export default { first: "First", second: "Second" }',
      'utf-8',
    )
    await callWatchChange(plugin, ctx.buildContext, path.join(realLocalesDir, 'en.ts'), 'update')

    const dts = await fs.readFile(path.join(dtsDir, 'locales.kanjou.d.ts'), 'utf-8')
    assert.match(dts, /second/)
  })
})

await it('Should watch an out-of-root localesDir and invalidate the locales virtual module when a new locale is added', async () => {
  await withTempDir(async (projectRoot) => {
    await withTempDir(async (externalParent) => {
      const outsideLocales = path.join(externalParent, 'shared-locales')
      const dtsDir = path.join(projectRoot, 'generated')
      await fs.mkdir(outsideLocales, { recursive: true })
      await fs.writeFile(
        path.join(outsideLocales, 'en.ts'),
        'export default { hello: "Hello" }',
        'utf-8',
      )

      const plugin = createPlugin({ localesDir: outsideLocales, dts: { outDir: dtsDir } })
      await callViteConfigResolved(plugin, projectRoot)

      const watcherAdded: string[] = []
      const { graph, modules, invalidatedIds } = createMockModuleGraph()
      const localesVid = '\0virtual:kanjou/locales'
      modules.set(localesVid, createPartialStub<ViteEnvModule>({ id: localesVid }))
      const env = createPartialStub<ViteDevEnv>({ moduleGraph: graph })

      await callViteConfigureServer(plugin, {
        environments: { client: env, ssr: env },
        watcher: createMockWatcher(watcherAdded),
      })

      const realOutsideLocales = await fs.realpath(outsideLocales)
      assert.ok(watcherAdded.includes(realOutsideLocales))

      const ctx = createContexts()
      await callBuildStart(plugin, ctx.buildContext)
      assert.ok(ctx.watchedFiles.has(realOutsideLocales))

      await callLoad(plugin, ctx.pluginContext, localesVid)

      const frPath = path.join(outsideLocales, 'fr.ts')
      await fs.writeFile(frPath, 'export default { hello: "Bonjour" }', 'utf-8')
      await callWatchChange(plugin, ctx.buildContext, frPath, 'create')

      assert.ok(invalidatedIds.includes(localesVid))
      const dts = await fs.readFile(path.join(dtsDir, 'locales.kanjou.d.ts'), 'utf-8')
      assert.match(dts, /"fr"/)
    })
  })
})

await it('Should enforce FlatLocale and LocaleNamespaces in client.d.ts and client-core.d.ts for mixed locales', async () => {
  await withTempDir(async (dir) => {
    const localesDir = path.join(dir, 'locales')
    const dtsDir = path.join(dir, 'generated')
    await fs.mkdir(path.join(localesDir, 'en'), { recursive: true })
    await fs.mkdir(path.join(localesDir, 'uk'), { recursive: true })
    await fs.writeFile(path.join(localesDir, 'en.ts'), 'export default { hello: "Hello" }', 'utf-8')
    await fs.writeFile(
      path.join(localesDir, 'ru.ts'),
      'export default { hello: "Привет" }',
      'utf-8',
    )
    await fs.writeFile(
      path.join(localesDir, 'en', 'common.ts'),
      'export default { save: "Save" }',
      'utf-8',
    )
    await fs.writeFile(
      path.join(localesDir, 'uk', 'common.ts'),
      'export default { save: "Зберегти" }',
      'utf-8',
    )

    const plugin = createPlugin({ localesDir, dts: { outDir: dtsDir } })
    const ctx = createContexts()
    await callBuildStart(plugin, ctx.buildContext)

    await setupTscProject(dir)
    await fs.mkdir(path.join(dir, 'src'), { recursive: true })

    await fs.writeFile(
      path.join(dir, 'src', 'valid.ts'),
      `import locales from 'virtual:kanjou/locales'
import namespaces from 'virtual:kanjou/namespaces'
export const p1 = locales['en']()
export const p2 = locales['ru']()
export const p3 = namespaces['en']['common']()
export const p4 = namespaces['uk']['common']()
`,
      'utf-8',
    )
    const validResult = await runTscNoEmit(dir)
    assert.equal(validResult.ok, true, validResult.output)

    await fs.writeFile(
      path.join(dir, 'src', 'invalid-flat.ts'),
      `import locales from 'virtual:kanjou/locales'\nexport const bad = locales['uk']()\n`,
      'utf-8',
    )
    const invalidFlatResult = await runTscNoEmit(dir)
    assert.equal(invalidFlatResult.ok, false)

    await fs.rm(path.join(dir, 'src', 'invalid-flat.ts'))
    await fs.writeFile(
      path.join(dir, 'src', 'invalid-ns.ts'),
      `import namespaces from 'virtual:kanjou/namespaces'\nexport const bad = namespaces['ru']['common']()\n`,
      'utf-8',
    )
    const invalidNsResult = await runTscNoEmit(dir)
    assert.equal(invalidNsResult.ok, false)

    await fs.rm(path.join(dir, 'src', 'invalid-ns.ts'))
    const corePlugin = createPlugin({
      localesDir,
      dts: { outDir: dtsDir, module: '@kanjou/core' },
    })
    await callBuildStart(corePlugin, ctx.buildContext)
    const coreValidResult = await runTscNoEmit(dir)
    assert.equal(coreValidResult.ok, true, coreValidResult.output)
  })
})

await it('Should handle Windows-style separator mismatches between file paths and localesDir', async (t) => {
  const emitRoots: string[] = []
  t.mock.method(path, 'resolve', (...args: string[]) => path.win32.resolve(...args))
  t.mock.method(path, 'relative', (from: string, to: string) => path.win32.relative(from, to))
  t.mock.method(path, 'isAbsolute', (p: string) => path.win32.isAbsolute(p))
  t.mock.method(path, 'parse', (p: string) => path.win32.parse(p))
  t.mock.method(path, 'join', (...args: string[]) => path.win32.join(...args))
  t.mock.method(Generator.prototype, 'emitDts', function stubEmitDts(this: Generator) {
    emitRoots.push(this.config.localesDir)
    return Promise.resolve([])
  })

  const plugin = createPlugin({
    localesDir: './locales',
    dts: { outDir: './generated' },
  })
  await callViteConfigResolved(plugin, 'C:\\proj')

  const ctx = createContexts()
  await callWatchChange(plugin, ctx.buildContext, 'C:/proj/locales/en.ts', 'update')
  await callWatchChange(plugin, ctx.buildContext, 'C:/proj/locales/en/common.ts', 'update')
  await callWatchChange(plugin, ctx.buildContext, 'C:/proj/other/en.ts', 'update')

  assert.deepEqual(emitRoots, ['C:\\proj\\locales', 'C:\\proj\\locales'])
})

await it('Should skip emitDts for unrelated files and non-base locale edits while regenerating on base locale and structural events', async (t) => {
  await withTempDir(async (dir) => {
    const localesDir = path.join(dir, 'locales')
    const dtsDir = path.join(dir, 'generated')
    await fs.mkdir(localesDir, { recursive: true })
    const enPath = path.join(localesDir, 'en.ts')
    const ukPath = path.join(localesDir, 'uk.ts')
    const notesPath = path.join(localesDir, 'notes.txt')
    const frPath = path.join(localesDir, 'fr.ts')

    await fs.writeFile(enPath, 'export default { hello: "Hello" }', 'utf-8')
    await fs.writeFile(ukPath, 'export default { hello: "Привіт" }', 'utf-8')
    await fs.writeFile(notesPath, 'some notes', 'utf-8')

    const plugin = createPlugin({
      baseLocale: 'en',
      localesDir,
      dts: { outDir: dtsDir },
    })
    await callViteConfigResolved(plugin, dir)
    const ctx = createContexts()
    await callBuildStart(plugin, ctx.buildContext)

    const emitSpy = t.mock.method(Generator.prototype, 'emitDts', () => Promise.resolve([]))

    await callWatchChange(plugin, ctx.buildContext, notesPath, 'create')
    await callWatchChange(plugin, ctx.buildContext, notesPath, 'update')
    await callWatchChange(plugin, ctx.buildContext, notesPath, 'delete')
    assert.equal(emitSpy.mock.callCount(), 0)

    await callWatchChange(plugin, ctx.buildContext, ukPath, 'update')
    assert.equal(emitSpy.mock.callCount(), 0)

    await fs.writeFile(enPath, 'export default { hello: "Hello", bye: "Bye" }', 'utf-8')
    await callWatchChange(plugin, ctx.buildContext, enPath, 'update')
    assert.equal(emitSpy.mock.callCount(), 1)

    await fs.writeFile(frPath, 'export default { hello: "Bonjour" }', 'utf-8')
    await callWatchChange(plugin, ctx.buildContext, frPath, 'create')
    assert.equal(emitSpy.mock.callCount(), 2)

    await fs.rm(frPath)
    await callWatchChange(plugin, ctx.buildContext, frPath, 'delete')
    assert.equal(emitSpy.mock.callCount(), 3)
  })
})
