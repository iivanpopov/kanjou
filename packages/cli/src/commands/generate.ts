import { Generator, getConfig } from '@kanjou/generator'
import consola from 'consola'

export async function generate() {
  const config = getConfig()

  if (config.dts === false) return

  const generator = new Generator(config)
  const emittedFiles = await generator.emitDts()

  emittedFiles.forEach((file) => {
    consola.success(`generated ${file}`)
  })
}
