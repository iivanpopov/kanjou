import type { Model } from 'messageformat'
import type { CodeBlockWriter, PropertySignatureStructure } from 'ts-morph'

import { parseMessage } from 'messageformat'
import { ModuleDeclarationKind, Project, StructureKind, Writers } from 'ts-morph'

export function compileAst(messages: Record<string, string>): string | undefined {
  const ast = Object.entries(messages).reduce(
    (acc, [key, value]) => {
      acc[key] = parseMessage(value)
      return acc
    },
    {} as Record<string, Model.Message>,
  )

  return `export default ${JSON.stringify(ast, null, 2)}`
}

export function compileLocales(locales: string[]): string {
  const entries = locales.map(
    (locale) =>
      `  "${locale}": () => import('virtual:kanjou/${locale}').then((mod) => mod.default)`,
  )

  return `export default {\n${entries.join(',\n')}\n}`
}

export function compileLocalesDts(messages: Record<string, string>, locales: string[]): string {
  const localeWriters = locales.map((locale) => (writer: CodeBlockWriter) => writer.quote(locale))

  const localeType =
    localeWriters.length >= 2
      ? Writers.unionType(localeWriters[0], localeWriters[1], ...localeWriters.slice(2))
      : (localeWriters[0] ?? 'never')

  const messageProperties: PropertySignatureStructure[] = Object.entries(messages ?? {}).map(
    ([key, message]) => {
      const ast = parseMessage(message)

      const values: Map<string, PropertySignatureStructure> = new Map()

      ast.declarations.forEach((declaration) => {
        const type = declaration.value.functionRef
          ? `{ __fn: '${declaration.value.functionRef.name}' }`
          : 'DefaultMessageValue'

        if (declaration.type === 'input') {
          values.set(declaration.name, {
            kind: StructureKind.PropertySignature,
            type,
            name: declaration.name,
          })
        }

        if (
          declaration.type === 'local' &&
          declaration.value.arg?.type === 'variable' &&
          !values.has(declaration.value.arg.name)
        ) {
          values.set(declaration.value.arg.name, {
            kind: StructureKind.PropertySignature,
            type,
            name: declaration.value.arg.name,
          })
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

        values.set(pattern.arg.name, {
          kind: StructureKind.PropertySignature,
          type,
          name: pattern.arg.name,
        })
      })

      return {
        kind: StructureKind.PropertySignature,
        name: JSON.stringify(key),
        type: Writers.objectType({ properties: values.values().toArray() }),
      }
    },
  )

  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('locales.kanjou.d.ts', {
    statements: [
      {
        kind: StructureKind.ImportDeclaration,
        moduleSpecifier: '@kanjou/react',
        namedImports: ['InferFunctionInput', 'DefaultMessageValue'],
        isTypeOnly: true,
      },
      {
        kind: StructureKind.Module,
        declarationKind: ModuleDeclarationKind.Module,
        name: `'@kanjou/react'`,
        hasDeclareKeyword: true,
        statements: [
          {
            kind: StructureKind.Interface,
            name: 'Register',
            isExported: true,
            properties: [
              { name: 'locale', type: localeType },
              { name: 'messages', type: Writers.objectType({ properties: messageProperties }) },
            ],
          },
        ],
      },
    ],
  })

  return sourceFile.getFullText()
}

export const VIRTUAL_DTS = `
declare module 'virtual:kanjou/*' {
  const messages: Partial<import('@kanjou/react').Messages>
  export default messages
}

declare module 'virtual:kanjou/locales' {
  const locales: Record<import('@kanjou/react').Locale, () => Promise<Record<string, import('@kanjou/react').Message>>>
  export default locales
}`

export function compileVirtualDts(): string {
  return VIRTUAL_DTS
}
