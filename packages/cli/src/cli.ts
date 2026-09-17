import { cac } from 'cac'

import { compare, compile, generate } from './commands'

const cli = cac('kanjou')

cli.command('compile', 'Pre-compile locale messages into AST.').action(compile)
cli.command('generate', 'Generate locale .d.ts type declarations.').action(generate)
cli
  .command('compare', 'Cross-compare locale files and output missing keys for each.')
  .action(compare)

cli.help()
cli.parse()

if (!cli.matchedCommand) cli.outputHelp()
