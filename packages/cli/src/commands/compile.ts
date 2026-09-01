import { Generator, getConfig } from '@kanjou/generator'
import consola from 'consola'
import path from 'node:path'

export async function compile() {
  const config = getConfig()

  const generator = new Generator(config)

  const localeFiles = await generator.compile()

  localeFiles.forEach((file) => {
    consola.success(`${file.relative} -> ${path.join(config.compile.outDir, `${file.name}.js`)}`)
  })
}
