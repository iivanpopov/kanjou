import { BUILTIN_FUNCTION_FILES } from '@kanjou/generator'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const VIRTUAL_FN_PREFIX = 'virtual:kanjou/fn/'
const NOOP_PARSE_ID = '\0kanjou:mf-noop-parse'
const NOOP_VALIDATE_ID = '\0kanjou:mf-noop-validate'
const DEFAULT_FUNCTIONS_ID = '\0kanjou:mf-default-functions'

const MF_ENTRY_RE = /[\\/]messageformat[\\/]lib[\\/]messageformat\.js$/
const ALLOWED_MF_FN_FILES = new Set(Object.values(BUILTIN_FUNCTION_FILES))

let cachedMfDir: string | null = null

function resolveMessageFormatDir(importer?: string): string | null {
  const candidates: string[] = []
  if (importer && !importer.startsWith('\0')) candidates.push(importer)
  candidates.push(path.join(process.cwd(), 'package.json'), import.meta.url)

  try {
    candidates.push(fileURLToPath(import.meta.resolve('@kanjou/generator')))
  } catch {}

  for (const candidate of candidates) {
    try {
      const req = createRequire(candidate)
      return path.dirname(req.resolve('messageformat/package.json'))
    } catch {}
  }

  return null
}

function getMfDir(importer?: string): string | null {
  cachedMfDir ??= resolveMessageFormatDir(importer)
  return cachedMfDir
}

export function resolveMessageFormatId(id: string, importer?: string): string | null | undefined {
  if (id.startsWith(VIRTUAL_FN_PREFIX)) {
    const file = id.slice(VIRTUAL_FN_PREFIX.length)
    if (!ALLOWED_MF_FN_FILES.has(file)) return null
    const mfDir = getMfDir(importer)
    if (!mfDir) return null
    return path.join(mfDir, 'lib', 'functions', file)
  }

  if (importer && MF_ENTRY_RE.test(importer)) {
    cachedMfDir ??= path.dirname(path.dirname(importer))
    if (id === './data-model/parse.js') return NOOP_PARSE_ID
    if (id === './data-model/validate.js') return NOOP_VALIDATE_ID
    if (id === './functions/index.js') return DEFAULT_FUNCTIONS_ID
  }
}

export function loadMessageFormatModule(id: string): string | undefined {
  if (id === NOOP_PARSE_ID) {
    return `export function parseMessage() { throw new Error('[kanjou] Runtime MF2 string parsing is disabled; pre-compile messages with @kanjou/plugin.') }`
  }

  if (id === NOOP_VALIDATE_ID) return 'export function validate() {}'

  if (id === DEFAULT_FUNCTIONS_ID) {
    return `export { default as DefaultFunctions } from 'virtual:kanjou/functions'`
  }
}
