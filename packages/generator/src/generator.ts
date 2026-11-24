import type { Model } from 'messageformat'
import type { Options as PrettierOptions } from 'prettier'

import { parseMessage, validate } from 'messageformat'
import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

import type { Config } from './config'
import type { ParsedFile } from './loader'

import {
  load,
  readLocaleFiles,
  readLocaleNamespaces,
  readLocaleWatchFiles,
  readNamespaceFiles,
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
  namespace?: string
  inputFile: string
  outputFile: string
}

export interface VirtualModule {
  code: string
  watchFiles: string[]
}

const RESERVED_LOCALE_NAMES = new Set(['locales', 'namespaces', 'functions'])
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

function compareStrings(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

function collectOptionVariables(
  container: unknown,
  locals: Set<string>,
  values: Map<string, TypeProperty>,
): void {
  if (!container || typeof container !== 'object') return

  let entries: Iterable<unknown>
  if (container instanceof Map) {
    entries = container.values()
  } else if (Array.isArray(container)) {
    entries = container
  } else {
    entries = Object.values(container)
  }

  for (const item of entries) {
    const candidate = Array.isArray(item) ? item[1] : item
    if (
      candidate &&
      typeof candidate === 'object' &&
      'type' in candidate &&
      candidate.type === 'variable' &&
      'name' in candidate &&
      typeof candidate.name === 'string' &&
      !locals.has(candidate.name) &&
      !values.has(candidate.name)
    ) {
      values.set(candidate.name, { type: 'DefaultMessageValue', name: candidate.name })
    }
  }
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

function buildVarAccess(name: string): string {
  if (SIMPLE_IDENT_RE.test(name)) return `v?.${name}`
  if (!name.includes('.')) return `v?.[${JSON.stringify(name)}]`

  const segments = name.split('.')
  const nested = segments.every((s) => SIMPLE_IDENT_RE.test(s))
    ? `v?.${segments.join('?.')}`
    : `v${segments.map((s) => `?.[${JSON.stringify(s)}]`).join('')}`
  return `(v?.[${JSON.stringify(name)}]??${nested})`
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

function getAstExpressions(ast: Model.Message): Model.Expression[] {
  const expressions: Model.Expression[] = []
  for (const decl of ast.declarations) expressions.push(decl.value)

  const parts =
    ast.type === 'message' ? ast.pattern : ast.variants.flatMap((variant) => variant.value)
  for (const part of parts) {
    if (typeof part === 'object' && part.type === 'expression') expressions.push(part)
  }
  return expressions
}

function collectUsedFunctions(messages: Record<string, string>): Set<string> {
  const used = new Set<string>()
  for (const value of Object.values(messages)) {
    for (const expr of getAstExpressions(parseMessage(value))) {
      if (expr.functionRef?.name) used.add(expr.functionRef.name)
    }
  }
  return used
}

interface BaseLocaleData {
  messages: Record<string, string>
  locales: string[]
  namespaces: string[]
  watchFiles: string[]
}

export class Generator {
  constructor(public config: Config) {}

  private validateReservedLocaleNames(localeFiles: ParsedFile[]): void {
    for (const file of localeFiles) {
      if (RESERVED_LOCALE_NAMES.has(file.name)) {
        throw new Error(
          `Reserved locale name "${file.name}" (${file.relative}) conflicts with virtual module "virtual:kanjou/${file.name}"`,
        )
      }
    }
  }

  async compile(): Promise<CompileResult[]> {
    const [localeFiles, localeNamespaces] = await Promise.all([
      readLocaleFiles(this.config.localesDir),
      readLocaleNamespaces(this.config.localesDir),
    ])

    this.validateReservedLocaleNames(localeFiles)

    const sortedLocaleFiles = [...localeFiles].sort((a, b) => compareStrings(a.name, b.name))
    const sortedNamespaces = Object.entries(localeNamespaces)
      .sort(([a], [b]) => compareStrings(a, b))
      .flatMap(([locale, files]) =>
        [...files].sort((a, b) => compareStrings(a.name, b.name)).map((file) => ({ locale, file })),
      )

    const [localeResults, namespaceResults] = await Promise.all([
      Promise.all(
        sortedLocaleFiles.map(async (file): Promise<CompileResult> => {
          const messages = await load<Record<string, string>>(file)
          const outputFile = await this.emitCompiled(file.name, messages)
          return { locale: file.name, inputFile: file.relative, outputFile }
        }),
      ),
      Promise.all(
        sortedNamespaces.map(async ({ locale, file }): Promise<CompileResult> => {
          const messages = await load<Record<string, string>>(file)
          const outputFile = await this.emitCompiled(path.join(locale, file.name), messages)
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

    const dtsStructure = this.buildDtsStructure(base.messages, base.locales, base.namespaces)
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
    this.validateReservedLocaleNames(localeFiles)
    const locales = localeFiles.map((file) => file.name)
    return {
      code: this.virtualLocalesToString(locales),
      watchFiles: localeFiles.map((file) => file.absolute),
    }
  }

  private async virtualNamespaces(): Promise<VirtualModule> {
    const localeNamespaces = await readLocaleNamespaces(this.config.localesDir)
    const watchFiles = Object.values(localeNamespaces).flatMap((files) =>
      files.map((file) => file.absolute),
    )
    return {
      code: this.virtualNamespacesToString(localeNamespaces),
      watchFiles,
    }
  }

  private async virtualFunctions(): Promise<VirtualModule> {
    const [localeFiles, localeNamespaces] = await Promise.all([
      readLocaleFiles(this.config.localesDir),
      readLocaleNamespaces(this.config.localesDir),
    ])

    this.validateReservedLocaleNames(localeFiles)

    const files = [...localeFiles, ...Object.values(localeNamespaces).flat()]
    if (!files.length) return { code: 'export default Object.create(null)', watchFiles: [] }

    const locales = Array.from(
      new Set([...localeFiles.map((file) => file.name), ...Object.keys(localeNamespaces)]),
    )

    const [loadedMessages, watchGroups] = await Promise.all([
      Promise.all(files.map((file) => load<Record<string, string>>(file))),
      Promise.all(locales.map((locale) => readLocaleWatchFiles(this.config.localesDir, locale))),
    ])

    const used = new Set<string>()
    for (const messages of loadedMessages) {
      for (const fn of collectUsedFunctions(messages)) used.add(fn)
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
    if (segments.length !== 2 || !isValidSegment(locale) || !isValidSegment(namespace)) {
      return null
    }

    const nsFiles = await readNamespaceFiles(this.config.localesDir, locale)
    const nsFile = nsFiles.find((file) => file.name === namespace)
    if (!nsFile) return null

    const [messages, watchFiles] = await Promise.all([
      load<Record<string, string>>(nsFile),
      readLocaleWatchFiles(this.config.localesDir, locale),
    ])

    return {
      code: this.compileMessagesToCode(messages),
      watchFiles: watchFiles.length > 0 ? watchFiles : [nsFile.absolute],
    }
  }

  private async virtualLocale(locale: string): Promise<VirtualModule | null> {
    const localeFiles = await readLocaleFiles(this.config.localesDir)
    this.validateReservedLocaleNames(localeFiles)
    const localeFile = localeFiles.find((file) => file.name === locale)
    if (!localeFile) return null

    const [messages, nestedWatchFiles] = await Promise.all([
      load<Record<string, string>>(localeFile),
      readLocaleWatchFiles(this.config.localesDir, locale),
    ])

    return {
      code: this.compileMessagesToCode(messages),
      watchFiles: [localeFile.absolute, ...nestedWatchFiles],
    }
  }

  private async loadBaseLocaleData(): Promise<BaseLocaleData | null> {
    const [localeFiles, localeNamespaces, nestedWatchFiles] = await Promise.all([
      readLocaleFiles(this.config.localesDir),
      readLocaleNamespaces(this.config.localesDir),
      readLocaleWatchFiles(this.config.localesDir, this.config.baseLocale),
    ])

    this.validateReservedLocaleNames(localeFiles)

    const locales = Array.from(
      new Set([...localeFiles.map((file) => file.name), ...Object.keys(localeNamespaces)]),
    ).sort()
    const baseNamespaces = localeNamespaces[this.config.baseLocale] ?? []
    const namespaces = baseNamespaces.map((file) => file.name).sort()
    const baseFile = localeFiles.find((file) => file.name === this.config.baseLocale)

    let messages: Record<string, string>
    const watchSet = new Set<string>(nestedWatchFiles)

    if (baseFile) {
      watchSet.add(baseFile.absolute)
      messages = await load<Record<string, string>>(baseFile)
    } else if (baseNamespaces.length > 0) {
      const loaded = await Promise.all(
        baseNamespaces.map((file) => {
          watchSet.add(file.absolute)
          return load<Record<string, string>>(file)
        }),
      )
      messages = Object.assign(Object.create(null), ...loaded)
    } else return null

    return { messages, locales, namespaces, watchFiles: Array.from(watchSet) }
  }

  private compileMessagesToCode(messages: Record<string, string>): string {
    const entries: string[] = []

    for (const [key, value] of Object.entries(messages)) {
      const ast = parseMessage(value)
      validate(ast)

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
  ): Promise<string> {
    const code = this.compileMessagesToCode(messages)
    const outPath = path.join(this.config.compile.outDir, `${relativeName}.js`)
    await this.writeFile(outPath, code)
    return outPath
  }

  private buildDtsStructure(
    messages: Record<string, string>,
    locales: string[],
    namespaces: string[],
  ): DtsStructure {
    const dtsMessages: Record<string, TypeProperty[]> = Object.create(null)

    const resolveType = (functionRef?: { name: string }): string =>
      functionRef ? `{ __fn: '${functionRef.name}' }` : 'DefaultMessageValue'

    for (const [key, message] of Object.entries(messages)) {
      const ast = parseMessage(message)
      const values = new Map<string, TypeProperty>()
      const locals = new Set<string>()

      for (const declaration of ast.declarations) {
        const type = resolveType(declaration.value.functionRef)

        if (declaration.type === 'input') {
          if (!locals.has(declaration.name)) {
            values.set(declaration.name, { type, name: declaration.name })
          }
          collectOptionVariables(declaration.value.functionRef?.options, locals, values)
          collectOptionVariables(declaration.value.attributes, locals, values)
        } else if (declaration.type === 'local') {
          if (
            declaration.value.arg?.type === 'variable' &&
            !locals.has(declaration.value.arg.name) &&
            !values.has(declaration.value.arg.name)
          ) {
            values.set(declaration.value.arg.name, { type, name: declaration.value.arg.name })
          }
          collectOptionVariables(declaration.value.functionRef?.options, locals, values)
          collectOptionVariables(declaration.value.attributes, locals, values)
          locals.add(declaration.name)
        }
      }

      if (ast.type === 'select') {
        for (const selector of ast.selectors) {
          if (
            selector.type === 'variable' &&
            !locals.has(selector.name) &&
            !values.has(selector.name)
          ) {
            values.set(selector.name, { type: 'DefaultMessageValue', name: selector.name })
          }
        }
      }

      const parts =
        ast.type === 'message' ? ast.pattern : ast.variants.flatMap((variant) => variant.value)

      for (const part of parts) {
        if (typeof part !== 'object') continue

        if (part.type === 'expression') {
          if (
            part.arg?.type === 'variable' &&
            !locals.has(part.arg.name) &&
            !values.has(part.arg.name)
          ) {
            values.set(part.arg.name, {
              type: resolveType(part.functionRef),
              name: part.arg.name,
            })
          }
          collectOptionVariables(part.functionRef?.options, locals, values)
          collectOptionVariables(part.attributes, locals, values)
        } else if (part.type === 'markup') {
          collectOptionVariables(part.options, locals, values)
          collectOptionVariables(part.attributes, locals, values)
        }
      }

      dtsMessages[key] = Array.from(values.values())
    }

    return { locales, namespaces, messages: dtsMessages }
  }

  private async dtsToString(dts: DtsStructure): Promise<string> {
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

    const code = `
      /// <reference types="@kanjou/plugin/client" />

      import type { DefaultMessageValue } from '@kanjou/react';

      declare module '@kanjou/react' {
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
