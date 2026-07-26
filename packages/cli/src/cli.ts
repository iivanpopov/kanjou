import { cac } from 'cac'

import { createContext } from '#/shared/context'

import { compare, compile, generate, missing, unused } from './commands'

export const context = createContext()

const cli = cac('kanjou')

cli
  .command('compile', 'Pre-compile locale messages into AST bundles.')
  .option('-l, --locales-dir <dir>', 'Directory containing locale files')
  .option('-b, --base-locale <name>', 'Base locale name (e.g. en)')
  .option('-o, --out-dir <dir>', 'Output directory for compiled AST files')
  .option('-e, --extension <format>', 'Output extension (js or json)')
  .action(compile)

cli
  .command('generate', 'Generate locale .d.ts type declarations.')
  .option('-l, --locales-dir <dir>', 'Directory containing locale files')
  .option('-b, --base-locale <name>', 'Base locale name (e.g. en)')
  .option('--locales', 'Generate locale .d.ts declarations')
  .option('--no-locales', 'Disable locale .d.ts generation')
  .option('--virtual', 'Generate virtual .d.ts declarations')
  .option('--no-virtual', 'Disable virtual .d.ts generation')
  .action(generate)

cli
  .command('compare', 'Cross-compare locale files and output missing keys for each.')
  .option('-l, --locales-dir <dir>', 'Directory containing locale files')
  .option('-b, --base-locale <name>', 'Base locale name (e.g. en)')
  .action(compare)

cli
  .command('missing', 'Find translation keys used in code but missing from locale files.')
  .option('-l, --locales-dir <dir>', 'Directory containing locale files')
  .option('-b, --base-locale <name>', 'Base locale name (e.g. en)')
  .action(missing)

cli
  .command('unused', 'Find keys in locale files that are not used in the code.')
  .option('-l, --locales-dir <dir>', 'Directory containing locale files')
  .option('-b, --base-locale <name>', 'Base locale name (e.g. en)')
  .action(unused)

cli.help()

cli.parse()

if (!cli.matchedCommand) cli.outputHelp()
