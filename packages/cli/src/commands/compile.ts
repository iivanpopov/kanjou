import consola from 'consola'
import path from 'node:path'

import type { ParsedPath } from '#/shared/io'

import { compileMessages } from '#/shared/codegen'
import { filterLocaleFiles, loadFile, readdir, writeFile } from '#/shared/io'
import { format } from '#/shared/prettier'

import { context } from '../cli'

export interface CompileOptions {
  localesDir?: string
  baseLocale?: string
  outDir?: string
}

export async function compile(options: CompileOptions = {}) {
  const config = await context.getConfig()

  const localesDir = options.localesDir ?? config.localesDir ?? './src/assets/locales'

  const configOutDir = typeof config.compile === 'object' ? config.compile.outDir : undefined
  const outDir = options.outDir ?? configOutDir ?? './src/assets/locales/compiled'

  const localeFiles = filterLocaleFiles(await readdir(localesDir))
  const outFiles = new Map<ParsedPath, string>(
    localeFiles.map((file) => [file, path.join(outDir, `${file.name}.js`)]),
  )

  await Promise.all(
    outFiles.entries().map(async ([key, value]) => {
      const messages = await loadFile<Record<string, string>>(key)
      const code = compileMessages(messages!)
      const formattedCode = await format(code, config.prettier)
      await writeFile(value, formattedCode, { mkdir: { recursive: true } })
    }),
  )

  outFiles.entries().forEach(([from, to]) => {
    consola.success(`${from.relative} -> ${to}`)
  })
}
