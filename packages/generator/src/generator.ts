import type { Model } from 'messageformat'
import type { Options as PrettierOptions } from 'prettier'

import { parseMessage, validate, visit } from 'messageformat'
import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

import type { Config } from './config'

import { compileMessage, createConstantPool, createRuntimeImports } from './compiler'
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
  flatLocales: string[]
  namespaces: string[]
  localeNamespaces: Record<string, string[]>
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

function formatObjectKey(key: string): string {
  if (key === '__proto__') return '["__proto__"]'
  if (SIMPLE_IDENT_RE.test(key)) return key
  return JSON.stringify(key)
}

export function compileMessages(
  messages: Readonly<Record<string, string>>,
  filePath = '<inline>',
): string {
  const entries: string[] = []
  const constants = createConstantPool()
  const runtimeImports = createRuntimeImports()

  for (const [key, value] of Object.entries(messages)) {
    const ast = parseAndValidateMessage(value, filePath, key)
    entries.push(
      `${formatObjectKey(key)}:${compileMessage(ast, constants.hoist, runtimeImports.use)}`,
    )
  }

  return `${runtimeImports.emit()}${constants.emit()}export default {${entries.join(',')}}`
}

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

interface BaseLocaleData {
  messages: Record<string, string>
  keyToFile: Map<string, string>
  locales: string[]
  flatLocales: string[]
  namespaces: string[]
  localeNamespaces: Record<string, string[]>
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
      base.flatLocales,
      base.namespaces,
      base.localeNamespaces,
      base.keyToFile,
    )
    const code = await this.dtsToString(dtsStructure)
    const outPath = path.join(this.config.dts.outDir, 'locales.kanjou.d.ts')

    const existing = await fs.readFile(outPath, 'utf-8').catch(() => undefined)
    if (existing !== code) {
      await this.writeFile(outPath, code)
    }
    return [outPath]
  }

  async virtual(target: 'locales' | 'namespaces' | (string & {})): Promise<VirtualModule | null> {
    if (target === 'locales') return await this.virtualLocales()
    if (target === 'namespaces') return await this.virtualNamespaces()
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

    const flatLocales = localeFiles.map((file) => file.name)
    const sortedLocaleNamespaces: Record<string, string[]> = Object.create(null)
    for (const [locale, files] of Object.entries(localeNamespaces).sort(([a], [b]) =>
      compareStrings(a, b),
    )) {
      sortedLocaleNamespaces[locale] = files.map((file) => file.name)
    }

    return {
      messages,
      keyToFile,
      locales,
      flatLocales,
      namespaces,
      localeNamespaces: sortedLocaleNamespaces,
      watchFiles: Array.from(watchSet),
    }
  }

  private compileMessagesToCode(messages: Record<string, string>, filePath: string): string {
    return compileMessages(messages, filePath)
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
    flatLocales: string[],
    namespaces: string[],
    localeNamespaces: Record<string, string[]>,
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

    return {
      locales,
      flatLocales,
      namespaces,
      localeNamespaces,
      messages: dtsMessages,
    }
  }

  private async dtsToString(dts: DtsStructure): Promise<string> {
    const targetModule = this.config.dts === false ? '@kanjou/react' : this.config.dts.module
    const serializedModule = JSON.stringify(targetModule)

    const localeType = dts.locales.length
      ? dts.locales.map((locale) => JSON.stringify(locale)).join(' | ')
      : 'never'

    const flatLocaleType = dts.flatLocales.length
      ? dts.flatLocales.map((locale) => JSON.stringify(locale)).join(' | ')
      : 'never'

    const namespaceLine = dts.namespaces.length
      ? `namespace: ${dts.namespaces.map((ns) => JSON.stringify(ns)).join(' | ')};`
      : ''

    const localeNamespaceEntries = Object.entries(dts.localeNamespaces).map(
      ([locale, namespaces]) => {
        const nsUnion = namespaces.length
          ? namespaces.map((ns) => JSON.stringify(ns)).join(' | ')
          : 'never'
        return `${JSON.stringify(locale)}: ${nsUnion}`
      },
    )
    const localeNamespacesType = localeNamespaceEntries.length
      ? `{ ${localeNamespaceEntries.join('; ')} }`
      : '{}'

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
          flatLocales: ${flatLocaleType};
          ${namespaceLine}
          localeNamespaces: ${localeNamespacesType};
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
}
