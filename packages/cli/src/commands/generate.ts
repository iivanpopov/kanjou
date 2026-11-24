import { Generator, getConfig } from '@kanjou/generator'
import consola from 'consola'

export async function generate(): Promise<void> {
  const config = getConfig()

  if (config.dts === false) return

  const generator = new Generator(config)
  const emittedFiles = await generator.emitDts()

  if (emittedFiles.length === 0) {
    throw new Error(`Base locale "${config.baseLocale}" not found`)
  }

  emittedFiles.forEach((file) => {
    consola.success(`generated ${file}`)
  })
}
