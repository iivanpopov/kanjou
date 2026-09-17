import type { Options as PrettierOptions } from 'prettier'

import { parseMessage } from 'messageformat'
import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

import type { Config } from './config'

import { load, readLocaleFiles } from './loader'

export interface TypeProperty {
  type: string
  name: string
}

export interface DtsStructure {
  locales: string[]
  messages: Record<string, TypeProperty[]>
}

export interface CompileResult {
  locale: string
  inputFile: string
  outputFile: string
}

export interface VirtualModule {
  code: string
  watchFiles: string[]
}

export class Generator {
  constructor(public config: Config) {}

  async compile(): Promise<CompileResult[]> {
    const localeFiles = await readLocaleFiles(this.config.localesDir)
    const results: CompileResult[] = []

    await Promise.all(
      localeFiles.map(async (file) => {
        const messages = await load<Record<string, string>>(file)
        const outputFile = await this.emitAst(file.name, messages)
        results.push({
          locale: file.name,
          inputFile: file.relative,
          outputFile,
        })
      }),
    )

    return results
  }

  async emitDts(): Promise<string[]> {
    if (this.config.dts === false) return []

    const localeFiles = await readLocaleFiles(this.config.localesDir)
    const locales = localeFiles.map((file) => file.name)
    const baseFile = localeFiles.find((file) => file.name === this.config.baseLocale)

    if (!baseFile) return []

    const messages = await load<Record<string, string>>(baseFile)
    const dtsStructure = this.buildDtsStructure(messages, locales)
    const code = await this.dtsToString(dtsStructure)
    const outPath = path.join(this.config.dts.outDir, 'locales.kanjou.d.ts')

    await this.writeFile(outPath, code)

    return [outPath]
  }

  async virtual(target: 'locales' | (string & {})): Promise<VirtualModule | null> {
    const localeFiles = await readLocaleFiles(this.config.localesDir)

    if (target === 'locales') {
      const locales = localeFiles.map((file) => file.name)
      return {
        code: this.virtualLocalesToString(locales),
        watchFiles: localeFiles.map((file) => file.absolute),
      }
    }

    const localeFile = localeFiles.find((file) => file.name === target)
    if (!localeFile) return null

    const messages = await load<Record<string, string>>(localeFile)
    const ast = this.ast(messages)
    return {
      code: this.astToString(ast),
      watchFiles: [localeFile.absolute],
    }
  }

  private ast(messages: Record<string, string>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(messages).map(([key, value]) => [key, parseMessage(value)]),
    )
  }

  private astToString(ast: Record<string, any>): string {
    return `export default ${JSON.stringify(ast, null, 2)}`
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  }

  private async emitAst(locale: string, messages: Record<string, string>): Promise<string> {
    const ast = this.ast(messages)
    const code = this.astToString(ast)
    const outPath = path.join(this.config.compile.outDir, `${locale}.js`)
    await this.writeFile(outPath, code)
    return outPath
  }

  private buildDtsStructure(messages: Record<string, string>, locales: string[]): DtsStructure {
    const dtsMessages: Record<string, TypeProperty[]> = {}

    const resolveType = (functionRef?: { name: string }): string =>
      functionRef ? `{ __fn: '${functionRef.name}' }` : 'DefaultMessageValue'

    for (const [key, message] of Object.entries(messages)) {
      const ast = parseMessage(message)
      const values = new Map<string, TypeProperty>()

      ast.declarations.forEach((declaration) => {
        const type = resolveType(declaration.value.functionRef)

        if (declaration.type === 'input') {
          values.set(declaration.name, { type, name: declaration.name })
        }

        if (
          declaration.type === 'local' &&
          declaration.value.arg?.type === 'variable' &&
          !values.has(declaration.value.arg.name)
        ) {
          values.set(declaration.value.arg.name, { type, name: declaration.value.arg.name })
        }
      })

      const patterns =
        ast.type === 'message'
          ? ast.pattern.filter((part) => typeof part === 'object')
          : ast.variants
              .flatMap((variant) => variant.value)
              .filter((part) => typeof part === 'object')

      patterns.forEach((pattern) => {
        if (
          pattern.type !== 'expression' ||
          pattern.arg?.type === 'literal' ||
          !pattern.arg?.name ||
          values.has(pattern.arg?.name)
        ) {
          return
        }

        const type = resolveType(pattern.functionRef)
        values.set(pattern.arg.name, { type, name: pattern.arg.name })
      })

      dtsMessages[key] = Array.from(values.values())
    }

    return { locales, messages: dtsMessages }
  }

  private async dtsToString(dts: DtsStructure): Promise<string> {
    const localeType =
      dts.locales.length > 0 ? dts.locales.map((locale) => `'${locale}'`).join(' | ') : 'never'

    const messageProperties = Object.entries(dts.messages).map(([key, properties]) => {
      const propertiesString = properties
        .map((property) => `${property.name}: ${property.type}`)
        .join('; ')
      return `  ${JSON.stringify(key)}: { ${propertiesString} }`
    })

    const code = `
      /// <reference types="@kanjou/plugin/client" />

      import type { DefaultMessageValue } from '@kanjou/react';

      declare module '@kanjou/react' {
        export interface Register {
          locale: ${localeType};
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
        `  "${locale}": () => import('virtual:kanjou/${locale}').then((module) => module.default)`,
    )
    return `export default {\n${entries.join(',\n')}\n}`
  }
}
