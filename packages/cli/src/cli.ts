import { cac } from 'cac'

import { compare, compile, generate, missing, unused } from './commands'

const cli = cac('kanjou')

cli
  .command('compile', 'Pre-compile locale messages into AST bundles.')
  .option('-l, --locales-dir <dir>', 'Directory containing locale files')
  .option('-b, --base-locale <name>', 'Base locale name (e.g. en)')
  .option('-o, --out-dir <dir>', 'Output directory for compiled AST files')
  .option('-f, --format <format>', 'Output format (mjs or json)')
  .action(compile)

cli
  .command('generate', 'Generate locale .d.ts type declarations.')
  .option('-l, --locales-dir <dir>', 'Directory containing locale files')
  .option('-b, --base-locale <name>', 'Base locale name (e.g. en)')
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
