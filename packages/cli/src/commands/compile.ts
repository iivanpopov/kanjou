import type { UserConfig } from '@kanjou/config'
import type { Options as PrettierOptions } from 'prettier'

import consola from 'consola'
import path from 'node:path'

import type { ParsedPath } from '#/shared/io'

import { compileMessages, format, parseMessages } from '#/shared/codegen'
import { filterLocaleFiles, readLocaleFile, readdir, writeFile } from '#/shared/io'

import { context } from '../cli'

export interface CompileOptions {
  localesDir?: string
  baseLocale?: string
  outDir?: string
  extension?: 'js' | 'json'
}

export interface ResolvedCompileOptions {
  localesDir: string
  baseLocale: string
  outDir: string
  extension: 'js' | 'json'
  prettier: Omit<PrettierOptions, 'parser'> | undefined
}

function resolveOptions(options: CompileOptions, config: UserConfig): ResolvedCompileOptions {
  const prettier = Object.assign({}, config.prettier, {
    parser: !options.extension ? 'typescript' : 'json',
  })

  return {
    baseLocale: options.baseLocale ?? config.baseLocale,
    localesDir: options.localesDir ?? config.localesDir,
    outDir: options.outDir ?? config.compile?.outDir ?? path.join(config.localesDir, 'compiled'),
    extension: options.extension ?? config.compile?.extension ?? 'js',
    prettier,
  }
}

export async function compile(_options: CompileOptions = {}) {
  const config = await context.getConfig()
  const options = resolveOptions(_options, config)

  const localeFiles = filterLocaleFiles(await readdir(options.localesDir))

  const outFiles = new Map<ParsedPath, string>(
    localeFiles.map((file) => [
      file,
      path.join(options.outDir, `${file.name}.${options.extension}`),
    ]),
  )

  await Promise.all(
    outFiles.entries().map(async ([key, value]) => {
      const messages = await readLocaleFile(key)

      const code =
        options.extension === 'js'
          ? compileMessages(messages!)
          : JSON.stringify(parseMessages(messages!), null, 2)
      const formattedCode = await format(code, options.prettier)

      await writeFile(value, formattedCode, { mkdir: { recursive: true } })
    }),
  )

  outFiles.entries().forEach(([key, value]) => {
    consola.success(`${key.relative} -> ${value}`)
  })
}
