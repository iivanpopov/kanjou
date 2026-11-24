import { BUILTIN_FUNCTION_FILES } from '@kanjou/generator'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { KanjouPluginError } from './errors'

const VIRTUAL_FN_PREFIX = 'virtual:kanjou/fn/'
const NOOP_PARSE_ID = '\0kanjou:mf-noop-parse'
const NOOP_VALIDATE_ID = '\0kanjou:mf-noop-validate'
const DEFAULT_FUNCTIONS_ID = '\0kanjou:mf-default-functions'

const MF_ENTRY_RE = /[\\/]messageformat[\\/]lib[\\/]messageformat\.js$/
const ALLOWED_MF_FN_FILES = new Set(Object.values(BUILTIN_FUNCTION_FILES))

function resolveMessageFormatDir(virtualId: string, importer?: string): string {
  const candidates: string[] = []
  if (importer && !importer.startsWith('\0')) candidates.push(importer)
  candidates.push(path.join(process.cwd(), 'package.json'), import.meta.url)

  let lastError: unknown
  try {
    candidates.push(fileURLToPath(import.meta.resolve('@kanjou/generator')))
  } catch (err) {
    lastError = err
  }

  for (const candidate of candidates) {
    try {
      const req = createRequire(candidate)
      return path.dirname(req.resolve('messageformat/package.json'))
    } catch (err) {
      lastError = err
    }
  }

  throw new KanjouPluginError(
    `Could not resolve "messageformat/package.json" for "${virtualId}". Searched from: ${candidates.join(', ')}.`,
    {
      cause: lastError,
      virtualId,
      searchPaths: candidates,
    },
  )
}

export interface MessageFormatResolver {
  resolveId: (id: string, importer?: string) => string | undefined
  load: (id: string) => string | undefined
}

export function createMessageFormatResolver(): MessageFormatResolver {
  const mfDirCache = new Map<string, Map<string, string>>()

  function getMfDir(virtualId: string, importer?: string): string {
    const importerDir = importer && !importer.startsWith('\0') ? path.dirname(importer) : ''
    const cwd = process.cwd()

    let cwdMap = mfDirCache.get(importerDir)
    const cached = cwdMap?.get(cwd)
    if (cached !== undefined) return cached

    const resolved = resolveMessageFormatDir(virtualId, importer)
    if (!cwdMap) {
      cwdMap = new Map<string, string>()
      mfDirCache.set(importerDir, cwdMap)
    }
    cwdMap.set(cwd, resolved)
    return resolved
  }

  return {
    resolveId(id: string, importer?: string): string | undefined {
      if (id.startsWith(VIRTUAL_FN_PREFIX)) {
        const file = id.slice(VIRTUAL_FN_PREFIX.length)
        if (!ALLOWED_MF_FN_FILES.has(file)) {
          throw new KanjouPluginError(
            `Unsupported virtual function module "${id}". Allowed built-in function files: ${[...ALLOWED_MF_FN_FILES].join(', ')}.`,
            { virtualId: id },
          )
        }
        const mfDir = getMfDir(id, importer)
        return path.join(mfDir, 'lib', 'functions', file)
      }

      if (importer && MF_ENTRY_RE.test(importer)) {
        if (id === './data-model/parse.js') return NOOP_PARSE_ID
        if (id === './data-model/validate.js') return NOOP_VALIDATE_ID
        if (id === './functions/index.js') return DEFAULT_FUNCTIONS_ID
      }

      return undefined
    },

    load(id: string): string | undefined {
      if (id === NOOP_PARSE_ID) {
        return `export function parseMessage() { throw new Error('[kanjou] Runtime MF2 string parsing is disabled; pre-compile messages with @kanjou/plugin.') }`
      }

      if (id === NOOP_VALIDATE_ID) return 'export function validate() {}'

      if (id === DEFAULT_FUNCTIONS_ID) {
        return `export { default as DefaultFunctions } from 'virtual:kanjou/functions'`
      }

      return undefined
    },
  }
}
