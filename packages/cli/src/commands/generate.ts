import { Generator, getConfig } from '@kanjou/generator'
import consola from 'consola'
import path from 'node:path'

export async function generate() {
  const config = getConfig()

  if (config.dts === false) return

  const generator = new Generator(config)
  await generator.generate()

  consola.success(`generated ${path.join(config.dts.outDir, 'locales.kanjou.d.ts')}`)
  consola.success(`generated ${path.join(config.dts.outDir, 'virtual.kanjou.d.ts')}`)
}
