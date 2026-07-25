import consola from 'consola'
import path from 'node:path'

import { compileMessages, parseMessages } from '#/shared/codegen'
import { createContext } from '#/shared/context'
import { filterLocaleFiles, readLocaleFile, readdir, writeFile } from '#/shared/io'

export interface CompileCommandOptions {
  localesDir?: string
  baseLocale?: string
  outDir?: string
  format?: 'js' | 'json'
}

export async function compile(options: CompileCommandOptions = {}) {
  const { localesDir, baseLocale, ...compile } = options
  const ctx = createContext({ localesDir, baseLocale, compile })
  const config = await ctx.getConfig()

  const files = await readdir(config.localesDir)
  const localeFiles = filterLocaleFiles(files)

  const outDir = options.outDir ?? config.compile?.outDir ?? path.join(config.localesDir, '.kanjou')
  const format = options.format ?? config.compile?.format ?? 'js'

  await Promise.all(
    localeFiles.map(async (file) => {
      const messages = await readLocaleFile(file)
      const code =
        format === 'js'
          ? compileMessages(messages ?? {})
          : JSON.stringify(parseMessages(messages ?? {}), null, 2)

      const outPath = path.join(outDir, `${file.name}.${format}`)
      await writeFile(outPath, code, { mkdir: { recursive: true } })
    }),
  )

  consola.success(`compiled ${localeFiles.length} locale(s) to ${outDir}`)
}
