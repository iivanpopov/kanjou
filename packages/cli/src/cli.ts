import { cac } from 'cac'

import { compare, compile, generate, missing, unused } from './commands'

const cli = cac('kanjou')

cli.command('compile', 'Pre-compile locale messages into AST.').action(compile)
cli.command('generate', 'Generate locale .d.ts type declarations.').action(generate)
cli
  .command('compare', 'Cross-compare locale files and output missing keys for each.')
  .action(compare)
cli
  .command('missing', 'Find translation keys used in code but missing from locale files.')
  .action(missing)
cli.command('unused', 'Find keys in locale files that are not used in the code.').action(unused)

cli.help()
cli.parse()

if (!cli.matchedCommand) cli.outputHelp()
