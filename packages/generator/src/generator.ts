import type { Options as PrettierOptions } from 'prettier'

import { parseMessage } from 'messageformat'
import fs from 'node:fs/promises'
import path from 'node:path'
import prettier from 'prettier'

import type { ParsedFile } from '#/shared/path'

import { load } from '#/shared/load'
import { parse } from '#/shared/path'

import type { Config } from './config'

export interface TypeProperty {
  type: string
  name: string
}

export interface DtsStructure {
  locales: string[]
  messages: Record<string, TypeProperty[]>
}

export const VIRTUAL_DTS = `
declare module 'virtual:kanjou/*' {
  const messages: Partial<import('@kanjou/react').Messages>
  export default messages
}

declare module 'virtual:kanjou/locales' {
  const locales: Record<import('@kanjou/react').Locale, () => Promise<Record<string, import('@kanjou/react').Message>>>
  export default locales
}
`

const LOCALE_EXTENSIONS = new Set(['.ts', '.js', '.mts', '.mjs'])

export async function readLocaleFiles(localesDir: string): Promise<ParsedFile[]> {
  const entries = await fs.readdir(localesDir)

  return entries
    .map((file) => parse(path.join(localesDir, file)))
    .filter((file) => LOCALE_EXTENSIONS.has(file.ext))
}

export class Generator {
  constructor(public config: Config) {}

  async compile(): Promise<ParsedFile[]> {
    const localeFiles = await readLocaleFiles(this.config.localesDir)

    await Promise.all(
      localeFiles.map(async (file) => {
        const messages = await load(file)
        await this.emitAst(file.name, messages)
      }),
    )

    return localeFiles
  }

  async generate(): Promise<void> {
    if (this.config.dts === false) return

    const localeFiles = await readLocaleFiles(this.config.localesDir)
    const locales = localeFiles.map((file) => file.name)
    const baseFile = localeFiles.find((file) => file.name === this.config.baseLocale)

    if (!baseFile) return

    const messages = await load(baseFile)

    await this.emitDts(messages, locales)
    await this.emitVirtualDts()
  }

  ast(messages: Record<string, string>): Record<string, any> {
    const astMap: Record<string, any> = {}
    for (const [key, value] of Object.entries(messages)) astMap[key] = parseMessage(value)
    return astMap
  }

  astToString(ast: Record<string, any>): string {
    return `export default ${JSON.stringify(ast, null, 2)}`
  }

  async emitAst(locale: string, messages: Record<string, string>): Promise<void> {
    const ast = this.ast(messages)
    const code = this.astToString(ast)
    const outPath = path.join(this.config.compile.outDir, `${locale}.js`)
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, code, 'utf-8')
  }

  dts(messages: Record<string, string>, locales: string[]): DtsStructure {
    const dtsMessages: Record<string, TypeProperty[]> = {}

    for (const [key, message] of Object.entries(messages)) {
      const ast = parseMessage(message)
      const values = new Map<string, TypeProperty>()

      ast.declarations.forEach((declaration) => {
        const type = declaration.value.functionRef
          ? `{ __fn: '${declaration.value.functionRef.name}' }`
          : 'DefaultMessageValue'

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

        const type = pattern.functionRef
          ? `{ __fn: '${pattern.functionRef.name}' }`
          : 'DefaultMessageValue'

        values.set(pattern.arg.name, { type, name: pattern.arg.name })
      })

      dtsMessages[key] = Array.from(values.values())
    }

    return { locales, messages: dtsMessages }
  }

  async dtsToString(dts: DtsStructure): Promise<string> {
    const localeType =
      dts.locales.length > 0 ? dts.locales.map((locale) => `'${locale}'`).join(' | ') : 'never'

    const messageProperties = Object.entries(dts.messages).map(([key, properties]) => {
      const propertiesString = properties
        .map((property) => `${property.name}: ${property.type}`)
        .join('; ')
      return `  ${JSON.stringify(key)}: { ${propertiesString} }`
    })

    const rawCode = `
      import type { InferFunctionInput, DefaultMessageValue } from '@kanjou/react';

      declare module '@kanjou/react' {
        export interface Register {
          locale: ${localeType};
          messages: {
            ${messageProperties.join('\n')}
          };
        }
      }
`

    if (this.config.prettier === false) return rawCode

    const prettierOptions: PrettierOptions = {
      parser: 'typescript',
      ...(typeof this.config.prettier === 'object' ? this.config.prettier : {}),
    }

    return prettier.format(rawCode, prettierOptions)
  }

  async emitDts(messages: Record<string, string>, locales: string[]): Promise<void> {
    if (this.config.dts === false) return

    const dtsStructure = this.dts(messages, locales)
    const code = await this.dtsToString(dtsStructure)
    const outPath = path.join(this.config.dts.outDir, 'locales.kanjou.d.ts')

    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, code, 'utf-8')
  }

  virtualLocalesToString(locales: string[]): string {
    const entries = locales.map(
      (locale) =>
        `  "${locale}": () => import('virtual:kanjou/${locale}').then((module) => module.default)`,
    )
    return `export default {\n${entries.join(',\n')}\n}`
  }

  async emitVirtualDts(): Promise<void> {
    if (this.config.dts === false) return

    const outPath = path.join(this.config.dts.outDir, 'virtual.kanjou.d.ts')
    let code = VIRTUAL_DTS

    if (this.config.prettier !== false) {
      const prettierOptions: PrettierOptions = {
        parser: 'typescript',
        ...(typeof this.config.prettier === 'object' ? this.config.prettier : {}),
      }
      code = await prettier.format(code, prettierOptions)
    }

    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, code, 'utf-8')
  }
}
