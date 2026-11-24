import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, it } from 'node:test'

import { findUnusedKeys } from './unused.ts'

function writeFixtureFile(rootDir: string, relativePath: string, content: string): void {
  const fullPath = path.join(rootDir, relativePath)
  mkdirSync(path.dirname(fullPath), { recursive: true })
  writeFileSync(fullPath, content, 'utf8')
}

function createTsProjectFixture(
  prefix: string,
  coreDts: string,
  files: Record<string, string>,
): string {
  const rootDir = mkdtempSync(path.join(tmpdir(), prefix))

  writeFixtureFile(
    rootDir,
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          noEmit: true,
        },
        include: ['src/**/*.ts'],
      },
      null,
      2,
    ),
  )

  writeFixtureFile(
    rootDir,
    'node_modules/@kanjou/core/package.json',
    JSON.stringify({
      name: '@kanjou/core',
      version: '0.7.0',
      type: 'module',
      types: './index.d.ts',
    }),
  )

  writeFixtureFile(rootDir, 'node_modules/@kanjou/core/index.d.ts', coreDts)
  for (const [relativePath, content] of Object.entries(files)) {
    writeFixtureFile(rootDir, relativePath, content)
  }

  return rootDir
}

void describe('findUnusedKeys', () => {
  void it('supports legacy @kanjou/core@0.7.0 object and 4-arg formatter signatures', () => {
    const legacyDts = `
export interface FormatMessageParams<Id extends string = string> {
  cache: unknown
  locale: string
  messages: Record<string, unknown>
  id: Id
  values?: Record<string, unknown>
  options?: unknown
}

export function formatMessage<Id extends string>(params: FormatMessageParams<Id>): string
export function formatMessage<Id extends string>(
  cache: unknown,
  locale: string,
  messages: Record<string, unknown>,
  id: Id,
  values?: Record<string, unknown>,
  options?: unknown,
): string

export function formatMessageParts<Id extends string>(params: FormatMessageParams<Id>): unknown[]
export function formatMessageParts<Id extends string>(
  cache: unknown,
  locale: string,
  messages: Record<string, unknown>,
  id: Id,
  values?: Record<string, unknown>,
  options?: unknown,
): unknown[]
`

    const source = `
import { formatMessage, formatMessageParts } from '@kanjou/core'
import * as core from '@kanjou/core'

const cache = {}
const messages = {}
const id = 'shorthand.key' as const

formatMessage({ cache, locale: 'en', messages, id: 'obj.key' })
formatMessage({ cache, locale: 'en', messages, id })
formatMessage(cache, 'en', messages, 'pos.key')
formatMessageParts(cache, 'en', messages, 'parts.key')
core.formatMessage({ cache, locale: 'en', messages, id: 'ns.key' })
`

    const tempDir = createTsProjectFixture('kanjou-unused-legacy-', legacyDts, {
      'src/index.ts': source,
    })
    try {
      const result = findUnusedKeys({
        tsconfigPath: tempDir,
        allKeys: ['obj.key', 'shorthand.key', 'pos.key', 'parts.key', 'ns.key', 'unused.key'],
      })
      assert.deepEqual(result, ['unused.key'])
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  void it('supports current @kanjou/core positional formatter signatures', () => {
    const currentDts = `
export function formatMessage<Id extends string>(
  locale: string,
  messages: Record<string, unknown>,
  id: Id,
  values?: Record<string, unknown>,
  getRuntime?: () => unknown,
): string

export function formatMessageParts<Id extends string>(
  locale: string,
  messages: Record<string, unknown>,
  id: Id,
  values?: Record<string, unknown>,
  getRuntime?: () => unknown,
): unknown[]
`

    const source = `
import { formatMessage, formatMessage as fm, formatMessageParts } from '@kanjou/core'
import * as core from '@kanjou/core'
import { reexportedFm } from './reexport'

const messages = {}
function unrelated(_a: string, _b: string, _c: string, _d: string) {
  return ''
}

formatMessage('en', messages, 'three.arg')
formatMessage('en', messages, 'four.arg', { count: 1 })
formatMessage('en', messages, 'five.arg', undefined, () => ({}))
formatMessageParts('en', messages, 'parts.arg')
fm('en', messages, 'aliased.key')
core.formatMessage('en', messages, 'ns.key')
reexportedFm('en', messages, 'reexported.key')
unrelated('a', 'b', 'unused.key', 'unused.key')
`

    const tempDir = createTsProjectFixture('kanjou-unused-current-', currentDts, {
      'src/reexport.ts': `export { formatMessage as reexportedFm } from '@kanjou/core'\n`,
      'src/index.ts': source,
    })
    try {
      const result = findUnusedKeys({
        tsconfigPath: tempDir,
        allKeys: [
          'three.arg',
          'four.arg',
          'five.arg',
          'parts.arg',
          'aliased.key',
          'ns.key',
          'reexported.key',
          'unused.key',
        ],
      })
      assert.deepEqual(result, ['unused.key'])
    } finally {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })
})

void describe('cli --help', () => {
  void it('describes compile as AOT-compiling locale messages into JavaScript modules', () => {
    const cliPath = path.resolve(import.meta.dirname, '../../dist/cli.mjs')
    const output = execFileSync(process.execPath, [cliPath, '--help'], { encoding: 'utf8' })
    assert.ok(output.includes('AOT-compile locale messages into JavaScript modules.'))
    assert.ok(!output.includes('AST'))
  })
})
