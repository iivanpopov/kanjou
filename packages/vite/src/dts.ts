import type { UserConfig } from '@kanjou/config'
import type { Model } from 'messageformat'
import type { PropertySignatureStructure } from 'ts-morph'

import { parseMessage } from 'messageformat'
import path from 'node:path'
import { Project, StructureKind, Writers } from 'ts-morph'

import { readdir, writeFile } from '#/shared/fs'

import { filterLocaleFiles, readLocaleFile } from './utils'

export async function compileLocalesDts(sourceLocale: string) {
  const localeFiles = await readdir(path.dirname(sourceLocale))

  const locales = filterLocaleFiles(localeFiles).map((file) => `"${file.name}"`)
  const localeType =
    locales.length >= 2
      ? Writers.unionType(locales[0], locales[1], ...locales.slice(2))
      : locales[0]

  const messages = await readLocaleFile(sourceLocale)

  const _ast = Object.entries(messages!).reduce(
    (acc, [key, value]) => {
      acc[key] = parseMessage(value)
      return acc
    },
    {} as Record<string, Model.Message>,
  )

  // console.dir(ast, { depth: null })

  const messageProperties: PropertySignatureStructure[] = []

  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('locales.d.ts', {
    statements: [
      { kind: StructureKind.ExportDeclaration },
      {
        kind: StructureKind.Module,
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

export async function writeLocalesDts(config: UserConfig) {
  const localesPath =
    config.dts?.localesPath ?? (config.dts?.outDir && path.join(config.dts.outDir, 'locales.d.ts'))
  if (!localesPath) return

  const localesDts = await compileLocalesDts(config.sourceLocale)
  await writeFile(localesPath, localesDts, { mkdir: { recursive: true } })
}

export const VIRTUAL_DTS = `declare module 'virtual:kanjou/*' {
  const messages: Partial<import('@kanjou/react').Messages>
  export default messages
}
declare module 'virtual:kanjou/locales' {
  const locales: Record<import('@kanjou/react').Locale, () => Promise<{ default: import('@kanjou/react').Messages }>>
  export default locales
}`

export async function writeVirtualDts(config: UserConfig) {
  const virtualPath =
    config.dts?.virtualPath ?? (config.dts?.outDir && path.join(config.dts.outDir, 'virtual.d.ts'))
  if (!virtualPath) return

  await writeFile(virtualPath, VIRTUAL_DTS, { mkdir: { recursive: true } })
}
