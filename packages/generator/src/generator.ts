import type { Model } from 'messageformat'
import type { Options as PrettierOptions } from 'prettier'

import { parseMessage, validate, visit } from 'messageformat'
import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

import type { Config } from './config'

import { KanjouMessageError } from './errors'
import {
  compareStrings,
  load,
  readAllLocales,
  readLocaleFiles,
  readLocaleNamespaces,
  readLocaleWatchFiles,
  readNamespaceFiles,
  validateReservedLocaleName,
  validateReservedLocaleNames,
} from './loader'

export interface TypeProperty {
  type: string
  name: string
}

export interface DtsStructure {
  locales: string[]
  namespaces: string[]
  messages: Record<string, TypeProperty[]>
}

export interface CompileResult {
  locale: string
  namespace?: string | undefined
  inputFile: string
  outputFile: string
}

export interface VirtualModule {
  code: string
  watchFiles: string[]
}

const SIMPLE_IDENT_RE = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
const TEMPLATE_ESCAPE_RE = /[\\`\r\n]|\$\{/g
const TEMPLATE_OPEN = '$' + '{'

function isValidSegment(segment: string): boolean {
  return (
    segment.length > 0 &&
    segment !== '.' &&
    segment !== '..' &&
    !segment.includes('/') &&
    !segment.includes('\\') &&
    !segment.includes('\0')
  )
}

const TEMPLATE_ESCAPES: Readonly<Record<string, string>> = {
  '\\': '\\\\',
  '`': '\\`',
  '\r': '\\r',
  '\n': '\\n',
  [TEMPLATE_OPEN]: '\\' + TEMPLATE_OPEN,
}

export const BUILTIN_FUNCTION_FILES: Readonly<Record<string, string>> = {
  integer: 'number.js',
  number: 'number.js',
  offset: 'offset.js',
  string: 'string.js',
}

type MessageKind = 'plain' | 'simple' | 'complex'

function parseAndValidateMessage(
  source: string,
  filePath: string,
  messageKey: string,
): Model.Message {
  try {
    const ast = parseMessage(source)
    validate(ast)
    return ast
  } catch (err) {
    throw new KanjouMessageError(
      `Invalid message "${messageKey}" in "${filePath}": ${err instanceof Error ? err.message : String(err)}`,
      filePath,
      messageKey,
      { cause: err },
    )
  }
}

function classifyMessage(ast: Model.Message): MessageKind {
  if (ast.type !== 'message' || ast.declarations.length > 0) return 'complex'
  if (ast.pattern.length === 0) return 'plain'
  if (ast.pattern.length === 1 && typeof ast.pattern[0] === 'string') return 'plain'

  const isSimple = ast.pattern.every(
    (part) =>
      typeof part === 'string' ||
      (part.type === 'expression' && part.arg?.type === 'variable' && !part.functionRef),
  )
  return isSimple ? 'simple' : 'complex'
}

function escapeTemplateChunk(str: string): string {
  return str.replace(TEMPLATE_ESCAPE_RE, (ch) => TEMPLATE_ESCAPES[ch] ?? ch)
}

function buildOwnRootAccess(name: string): string {
  const key = JSON.stringify(name)
  if (SIMPLE_IDENT_RE.test(name)) {
    return `(v!=null&&Object.hasOwn(v,${key})?v.${name}:undefined)`
  }
  return `(v!=null&&Object.hasOwn(v,${key})?v[${key}]:undefined)`
}

function buildVarAccess(name: string): string {
  if (!name.includes('.')) return buildOwnRootAccess(name)

  const segments = name.split('.')
  const first = segments[0]
  if (first === undefined) return buildOwnRootAccess(name)

  const rest = segments.slice(1)
  const root = buildOwnRootAccess(first)
  const nestedTail = rest.every((s) => SIMPLE_IDENT_RE.test(s))
    ? rest.map((s) => `?.${s}`).join('')
    : rest.map((s) => `?.[${JSON.stringify(s)}]`).join('')

  return `(${buildOwnRootAccess(name)}??${root}${nestedTail})`
}

function compileSimpleMessage(ast: Model.PatternMessage): string {
  const chunks = ast.pattern.map((part) => {
    if (typeof part === 'string') return escapeTemplateChunk(part)
    const name = (part as Model.Expression & { arg: Model.VariableRef }).arg.name
    const fallback = JSON.stringify(`{$${name}}`)
    return `${TEMPLATE_OPEN}${buildVarAccess(name)}??${fallback}}`
  })
  return `(v)=>\`${chunks.join('')}\``
}

function collectUsedFunctions(messages: Record<string, string>, filePath: string): Set<string> {
  const used = new Set<string>()
  for (const [key, value] of Object.entries(messages)) {
    try {
      const ast = parseMessage(value)
      const { functions } = validate(ast)
      for (const fn of functions) used.add(fn)
    } catch (err) {
      throw new KanjouMessageError(
        `Invalid message "${key}" in "${filePath}": ${err instanceof Error ? err.message : String(err)}`,
        filePath,
        key,
        { cause: err },
      )
    }
  }
  return used
}

interface BaseLocaleData {
  messages: Record<string, string>
  keyToFile: Map<string, string>
  locales: string[]
  namespaces: string[]
  watchFiles: string[]
}

export class Generator {
  constructor(public config: Config) {}

  async compile(): Promise<CompileResult[]> {
    const { localeFiles, localeNamespaces } = await readAllLocales(this.config.localesDir)

    const namespaceEntries = Object.entries(localeNamespaces)
      .sort(([a], [b]) => compareStrings(a, b))
      .flatMap(([locale, files]) => files.map((file) => ({ locale, file })))

    const [localeResults, namespaceResults] = await Promise.all([
      Promise.all(
        localeFiles.map(async (file): Promise<CompileResult> => {
          const messages = await load(file)
          const outputFile = await this.emitCompiled(file.name, messages, file.relative)
          return { locale: file.name, inputFile: file.relative, outputFile }
        }),
      ),
      Promise.all(
        namespaceEntries.map(async ({ locale, file }): Promise<CompileResult> => {
          const messages = await load(file)
          const outputFile = await this.emitCompiled(
            path.join(locale, file.name),
            messages,
            file.relative,
          )
          return {
            locale,
            namespace: file.name,
            inputFile: file.relative,
            outputFile,
          }
        }),
      ),
    ])

    return [...localeResults, ...namespaceResults]
  }

  async emitDts(): Promise<string[]> {
    if (this.config.dts === false) return []

    const base = await this.loadBaseLocaleData()
    if (!base) return []

    const dtsStructure = this.buildDtsStructure(
      base.messages,
      base.locales,
      base.namespaces,
      base.keyToFile,
    )
    const code = await this.dtsToString(dtsStructure)
    const outPath = path.join(this.config.dts.outDir, 'locales.kanjou.d.ts')

    await this.writeFile(outPath, code)
    return [outPath]
  }

  async virtual(
    target: 'locales' | 'namespaces' | 'functions' | (string & {}),
  ): Promise<VirtualModule | null> {
    if (target === 'locales') return await this.virtualLocales()
    if (target === 'namespaces') return await this.virtualNamespaces()
    if (target === 'functions') return await this.virtualFunctions()
    if (target.includes('/')) return await this.virtualNamespace(target)
    return await this.virtualLocale(target)
  }

  private async virtualLocales(): Promise<VirtualModule> {
    const localeFiles = await readLocaleFiles(this.config.localesDir)
    validateReservedLocaleNames(localeFiles)
    const locales = localeFiles.map((file) => file.name)
    return {
      code: this.virtualLocalesToString(locales),
      watchFiles: localeFiles.map((file) => file.absolute),
    }
  }

  private async virtualNamespaces(): Promise<VirtualModule> {
    const localeNamespaces = await readLocaleNamespaces(this.config.localesDir)
    validateReservedLocaleNames([], Object.keys(localeNamespaces), this.config.localesDir)
    const watchFiles = Object.values(localeNamespaces).flatMap((files) =>
      files.map((file) => file.absolute),
    )
    return {
      code: this.virtualNamespacesToString(localeNamespaces),
      watchFiles,
    }
  }

  private async virtualFunctions(): Promise<VirtualModule> {
    const { locales, localeFiles, localeNamespaces } = await readAllLocales(this.config.localesDir)

    const files = [...localeFiles, ...Object.values(localeNamespaces).flat()]
    if (!files.length) return { code: 'export default Object.create(null)', watchFiles: [] }

    const [loadedMessages, watchGroups] = await Promise.all([
      Promise.all(files.map(async (file) => ({ file, messages: await load(file) }))),
      Promise.all(locales.map((locale) => readLocaleWatchFiles(this.config.localesDir, locale))),
    ])

    const used = new Set<string>()
    for (const { file, messages } of loadedMessages) {
      for (const fn of collectUsedFunctions(messages, file.relative)) used.add(fn)
    }

    const watchFiles = Array.from(
      new Set([...files.map((file) => file.absolute), ...watchGroups.flat()]),
    )

    return {
      code: this.virtualFunctionsToString(used),
      watchFiles,
    }
  }

  private async virtualNamespace(target: string): Promise<VirtualModule | null> {
    const segments = target.split('/')
    const [locale, namespace] = segments
    if (
      segments.length !== 2 ||
      locale === undefined ||
      namespace === undefined ||
      !isValidSegment(locale) ||
      !isValidSegment(namespace)
    ) {
      return null
    }

    validateReservedLocaleName(locale, target)

    const nsFiles = await readNamespaceFiles(this.config.localesDir, locale)
    const nsFile = nsFiles.find((file) => file.name === namespace)
    if (!nsFile) return null

    const [messages, watchFiles] = await Promise.all([
      load(nsFile),
      readLocaleWatchFiles(this.config.localesDir, locale),
    ])

    return {
      code: this.compileMessagesToCode(messages, nsFile.relative),
      watchFiles: watchFiles.length > 0 ? watchFiles : [nsFile.absolute],
    }
  }

  private async virtualLocale(locale: string): Promise<VirtualModule | null> {
    const localeFiles = await readLocaleFiles(this.config.localesDir)
    validateReservedLocaleNames(localeFiles)
    const localeFile = localeFiles.find((file) => file.name === locale)
    if (!localeFile) return null

    const [messages, nestedWatchFiles] = await Promise.all([
      load(localeFile),
      readLocaleWatchFiles(this.config.localesDir, locale),
    ])

    return {
      code: this.compileMessagesToCode(messages, localeFile.relative),
      watchFiles: [localeFile.absolute, ...nestedWatchFiles],
    }
  }

  private async loadBaseLocaleData(): Promise<BaseLocaleData | null> {
    const [{ locales, localeFiles, localeNamespaces }, nestedWatchFiles] = await Promise.all([
      readAllLocales(this.config.localesDir),
      readLocaleWatchFiles(this.config.localesDir, this.config.baseLocale),
    ])

    const baseNamespaces = localeNamespaces[this.config.baseLocale] ?? []
    const namespaces = baseNamespaces.map((file) => file.name)
    const baseFile = localeFiles.find((file) => file.name === this.config.baseLocale)

    if (!baseFile && baseNamespaces.length === 0) return null

    const filesToLoad = baseFile ? [baseFile, ...baseNamespaces] : baseNamespaces
    const watchSet = new Set<string>(nestedWatchFiles)
    const loadedEntries = await Promise.all(
      filesToLoad.map(async (file) => {
        watchSet.add(file.absolute)
        return { file, messages: await load(file) }
      }),
    )

    const messages: Record<string, string> = Object.create(null)
    const keyToFile = new Map<string, string>()

    for (const { file, messages: fileMessages } of loadedEntries) {
      for (const [key, value] of Object.entries(fileMessages)) {
        messages[key] = value
        keyToFile.set(key, file.relative)
      }
    }

    return { messages, keyToFile, locales, namespaces, watchFiles: Array.from(watchSet) }
  }

  private compileMessagesToCode(messages: Record<string, string>, filePath: string): string {
    const entries: string[] = []

    for (const [key, value] of Object.entries(messages)) {
      const ast = parseAndValidateMessage(value, filePath, key)

      const serializedKey = JSON.stringify(key)
      const kind = classifyMessage(ast)

      if (kind === 'plain') {
        const text = (ast as Model.PatternMessage).pattern[0] ?? ''
        entries.push(`[${serializedKey}]:${JSON.stringify(text)}`)
      } else if (kind === 'simple') {
        entries.push(`[${serializedKey}]:${compileSimpleMessage(ast as Model.PatternMessage)}`)
      } else {
        entries.push(`[${serializedKey}]:${JSON.stringify(ast)}`)
      }
    }

    return `export default {${entries.join(',')}}`
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  }

  private async emitCompiled(
    relativeName: string,
    messages: Record<string, string>,
    inputFilePath: string,
  ): Promise<string> {
    const code = this.compileMessagesToCode(messages, inputFilePath)
    const outPath = path.join(this.config.compile.outDir, `${relativeName}.js`)
    await this.writeFile(outPath, code)
    return outPath
  }

  private buildDtsStructure(
    messages: Record<string, string>,
    locales: string[],
    namespaces: string[],
    keyToFile?: ReadonlyMap<string, string>,
  ): DtsStructure {
    const dtsMessages: Record<string, TypeProperty[]> = Object.create(null)

    const resolveType = (functionRef?: { name: string }): string =>
      functionRef ? `{ __fn: ${JSON.stringify(functionRef.name)} }` : 'DefaultMessageValue'

    for (const [key, message] of Object.entries(messages)) {
      const filePath = keyToFile?.get(key) ?? this.config.baseLocale
      const ast = parseAndValidateMessage(message, filePath, key)
      const values = new Map<string, TypeProperty>()
      const locals = new Set<string>()

      const recordVariable = (name: string, functionRef?: { name: string }): void => {
        if (locals.has(name)) return
        const existing = values.get(name)
        if (!existing) {
          values.set(name, { type: resolveType(functionRef), name })
        } else if (functionRef && existing.type === 'DefaultMessageValue') {
          values.set(name, { type: resolveType(functionRef), name })
        }
      }

      visit(ast, {
        declaration(decl) {
          if (decl.type === 'local') {
            return () => {
              locals.add(decl.name)
            }
          }
          return undefined
        },
        expression(expr) {
          if (expr.arg?.type === 'variable') {
            recordVariable(expr.arg.name, expr.functionRef)
          }
        },
        value(val, context, position) {
          if (val.type === 'variable' && (position !== 'arg' || context === 'selector')) {
            recordVariable(val.name)
          }
        },
      })

      dtsMessages[key] = Array.from(values.values())
    }

    return { locales, namespaces, messages: dtsMessages }
  }

  private async dtsToString(dts: DtsStructure): Promise<string> {
    const targetModule = this.config.dts === false ? '@kanjou/react' : this.config.dts.module
    const serializedModule = JSON.stringify(targetModule)

    const localeType = dts.locales.length
      ? dts.locales.map((locale) => JSON.stringify(locale)).join(' | ')
      : 'never'

    const namespaceLine = dts.namespaces.length
      ? `namespace: ${dts.namespaces.map((ns) => JSON.stringify(ns)).join(' | ')};`
      : ''

    const messageProperties = Object.entries(dts.messages).map(([key, properties]) => {
      const propertiesString = properties
        .map((property) => {
          const propName = SIMPLE_IDENT_RE.test(property.name)
            ? property.name
            : JSON.stringify(property.name)
          return `${propName}: ${property.type}`
        })
        .join('; ')
      return `  ${JSON.stringify(key)}: { ${propertiesString} }`
    })

    const clientTypes =
      targetModule === '@kanjou/core' ? '@kanjou/plugin/client/core' : '@kanjou/plugin/client'

    const code = `
      /// <reference types="${clientTypes}" />

      import type { DefaultMessageValue } from ${serializedModule};

      declare module ${serializedModule} {
        export interface Register {
          locale: ${localeType};
          ${namespaceLine}
          messages: {
            ${messageProperties.join('\n')}
          };
        }
      }
`

    if (this.config.prettier === false) return code

    const prettierOptions: PrettierOptions = {
      parser: 'typescript',
      ...(typeof this.config.prettier === 'object' ? this.config.prettier : {}),
    }

    return await prettier.format(code, prettierOptions)
  }

  private virtualLocalesToString(locales: string[]): string {
    const entries = locales.map(
      (locale) =>
        `  [${JSON.stringify(locale)}]: () => import(${JSON.stringify(`virtual:kanjou/${locale}`)}).then((module) => module.default)`,
    )
    return `export default {\n${entries.join(',\n')}\n}`
  }

  private virtualNamespacesToString(localeNamespaces: Record<string, { name: string }[]>): string {
    const localeEntries = Object.entries(localeNamespaces).map(([locale, files]) => {
      const nsEntries = files.map(
        (file) =>
          `    [${JSON.stringify(file.name)}]: () => import(${JSON.stringify(`virtual:kanjou/${locale}/${file.name}`)}).then((module) => module.default)`,
      )
      return `  [${JSON.stringify(locale)}]: {\n${nsEntries.join(',\n')}\n  }`
    })
    return `export default {\n${localeEntries.join(',\n')}\n}`
  }

  private virtualFunctionsToString(used: Set<string>): string {
    const byFile = new Map<string, string[]>()
    const usedBuiltins: string[] = []

    for (const name of Array.from(used).sort()) {
      const file = BUILTIN_FUNCTION_FILES[name]
      if (!file) continue

      usedBuiltins.push(name)

      const list = byFile.get(file)
      if (list) list.push(name)
      else byFile.set(file, [name])
    }

    if (usedBuiltins.length === 0) return 'export default Object.create(null)'

    const imports = Array.from(byFile.entries()).map(
      ([file, names]) => `import { ${names.join(', ')} } from 'virtual:kanjou/fn/${file}'`,
    )

    return `${imports.join('\n')}\nexport default Object.assign(Object.create(null), {${usedBuiltins.join(',')}})`
  }
}
