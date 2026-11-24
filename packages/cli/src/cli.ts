import { cac } from 'cac'
import consola from 'consola'

import { compare, compile, generate, unused } from './commands'

function reportCliError(err: unknown): void {
  consola.error(err instanceof Error ? err.message : String(err))
  process.exitCode = 1
}

function withErrorHandler<T extends unknown[]>(action: (...args: T) => Promise<void>) {
  return async (...args: T) => {
    try {
      await action(...args)
    } catch (err) {
      reportCliError(err)
    }
  }
}

const cli = cac('kanjou')

cli
  .command('compile', 'AOT-compile locale messages into JavaScript modules.')
  .action(withErrorHandler(compile))
cli
  .command('generate', 'Generate locale .d.ts type declarations.')
  .action(withErrorHandler(generate))
cli
  .command('compare', 'Cross-compare locale files and output missing keys for each.')
  .action(withErrorHandler(compare))
cli
  .command('unused', 'Output unused keys from the base locale.')
  .option('--tsconfig <path>', 'Path to tsconfig.json file or directory.')
  .option(
    '--ignore-full-catalog-union',
    'Ignore dynamic keys whose type covers the entire catalog union.',
  )
  .action(
    withErrorHandler((options: { tsconfig?: string; ignoreFullCatalogUnion?: boolean }) =>
      unused({
        tsconfigPath: options.tsconfig,
        ignoreFullCatalogUnion: options.ignoreFullCatalogUnion,
      }),
    ),
  )

cli.addEventListener('command:*', () => {
  if (cli.options['help']) return
  consola.error(`Unknown command: ${cli.args.join(' ')}`)
  process.exitCode = 1
})

cli.help()
try {
  const parsed = cli.parse()
  if (!cli.matchedCommand && !parsed.options['help'] && cli.args.length === 0) {
    cli.outputHelp()
  }
} catch (err) {
  reportCliError(err)
}
