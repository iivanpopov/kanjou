import { compileMessages, Generator, getConfig, readLocaleFiles } from '@kanjou/generator'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'kanjou-gen-test-'))
  try {
    await fn(dir)
  } finally {
    await fs.rm(dir, { recursive: true, force: true })
  }
}

await describe('@kanjou/generator', async () => {
  await it('getConfig resolves config file and output paths relative to rootDir regardless of cwd', async () => {
    await withTempDir(async (rootDir) => {
      await withTempDir(async (otherCwd) => {
        await fs.writeFile(
          path.join(rootDir, 'kanjou.config.json'),
          JSON.stringify({
            baseLocale: 'uk',
            localesDir: './my-locales',
            compile: { outDir: './out-compiled' },
            dts: { outDir: './out-types', module: '@kanjou/core' },
          }),
          'utf-8',
        )

        const prevCwd = process.cwd()
        process.chdir(otherCwd)
        try {
          const config = getConfig({}, rootDir)
          assert.equal(config.baseLocale, 'uk')
          assert.equal(config.localesDir, path.resolve(rootDir, './my-locales'))
          assert.equal(config.compile.outDir, path.resolve(rootDir, './out-compiled'))
          assert.deepEqual(config.dts, {
            outDir: path.resolve(rootDir, './out-types'),
            module: '@kanjou/core',
          })
        } finally {
          process.chdir(prevCwd)
        }
      })
    })
  })

  await it('readLocaleFiles ignores .d.ts, .d.mts, and .d.cts declaration files', async () => {
    await withTempDir(async (localesDir) => {
      await fs.writeFile(path.join(localesDir, 'en.ts'), 'export default {}', 'utf-8')
      await fs.writeFile(path.join(localesDir, 'uk.mts'), 'export default {}', 'utf-8')
      await fs.writeFile(path.join(localesDir, 'locales.kanjou.d.ts'), 'export type T = 1', 'utf-8')
      await fs.writeFile(path.join(localesDir, 'foo.d.mts'), 'export type T = 1', 'utf-8')
      await fs.writeFile(path.join(localesDir, 'bar.d.cts'), 'export type T = 1', 'utf-8')

      const files = await readLocaleFiles(localesDir)
      assert.deepEqual(
        files.map((f) => f.base),
        ['en.ts', 'uk.mts'],
      )
    })
  })

  await it('emitDts emits flatLocales and localeNamespaces and skips rewriting unchanged output', async () => {
    await withTempDir(async (rootDir) => {
      const localesDir = path.join(rootDir, 'locales')
      const outDir = path.join(rootDir, 'generated')
      await fs.mkdir(path.join(localesDir, 'en'), { recursive: true })
      await fs.mkdir(path.join(localesDir, 'uk'), { recursive: true })
      await fs.mkdir(path.join(localesDir, 'fr'), { recursive: true })

      await fs.writeFile(
        path.join(localesDir, 'en.ts'),
        'export default { hello: "Hello {$name}" }',
        'utf-8',
      )
      await fs.writeFile(path.join(localesDir, 'uk.ts'), 'export default {}', 'utf-8')
      await fs.writeFile(
        path.join(localesDir, 'en', 'common.ts'),
        'export default { save: "Save" }',
        'utf-8',
      )
      await fs.writeFile(
        path.join(localesDir, 'en', 'auth.ts'),
        'export default { login: "Login" }',
        'utf-8',
      )
      await fs.writeFile(
        path.join(localesDir, 'uk', 'common.ts'),
        'export default { save: "Зберегти" }',
        'utf-8',
      )
      await fs.writeFile(
        path.join(localesDir, 'fr', 'onlyNs.ts'),
        'export default { ok: "Oui" }',
        'utf-8',
      )

      const config = getConfig(
        {
          baseLocale: 'en',
          localesDir,
          dts: { outDir, module: '@kanjou/core' },
          prettier: false,
        },
        rootDir,
      )
      const generator = new Generator(config)
      const emitted = await generator.emitDts()
      assert.equal(emitted.length, 1)
      const dtsPath = emitted[0]
      const content = await fs.readFile(dtsPath, 'utf-8')

      assert.match(content, /locale:\s*'en'\s*\|\s*'fr'\s*\|\s*'uk'|"en"\s*\|\s*"fr"\s*\|\s*"uk"/)
      assert.match(content, /flatLocales:\s*(?:"en"\s*\|\s*"uk"|'en'\s*\|\s*'uk')/)
      assert.match(content, /"en":\s*"auth"\s*\|\s*"common"/)
      assert.match(content, /"fr":\s*"onlyNs"/)
      assert.match(content, /"uk":\s*"common"/)

      const pastTime = new Date(Date.now() - 60_000)
      await fs.utimes(dtsPath, pastTime, pastTime)
      const statBefore = await fs.stat(dtsPath)

      await generator.emitDts()
      const statAfter = await fs.stat(dtsPath)
      assert.equal(statAfter.mtimeMs, statBefore.mtimeMs)
    })
  })

  await it('compileMessages emits no inline closures for :integer/:offset and omits unused declarations', () => {
    const code = compileMessages({
      int: '{$n :integer}',
      off: '{$n :offset add=2 subtract=$d}',
      unused: '.local $u = {$x :doesNotExist}\n{{Hello {$name}}}',
      lazyMatch:
        '.local $a = {$x :customA}\n.local $b = {$y :customB}\n.input {$role :string}\n.match $role\nadmin {{Admin {$a}}}\n* {{Guest}}',
    })

    assert.match(code, /r\.integer\(/)
    assert.match(code, /r\.offset\(/)
    assert.doesNotMatch(code, /\(_n\)=>/)
    assert.doesNotMatch(code, /\(_n,_d\)=>/)
    assert.doesNotMatch(code, /doesNotExist/)
    assert.doesNotMatch(code, /customB/)
    assert.match(code, /if\(.+?==="admin"\)\{const _d\d+=r\.fn\("customA"/)
  })
})
