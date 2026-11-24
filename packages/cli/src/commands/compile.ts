import { Generator, getConfig } from '@kanjou/generator'
import consola from 'consola'

export async function compile(): Promise<void> {
  const config = getConfig()

  const generator = new Generator(config)

  const results = await generator.compile()

  results.forEach((result) => {
    consola.success(`${result.inputFile} -> ${result.outputFile}`)
  })
}
