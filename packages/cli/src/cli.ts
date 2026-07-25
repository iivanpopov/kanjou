import { cac } from 'cac'

import { createContext } from '#/shared/context'

import { compare, generate, missing, unused } from './commands'

const cli = cac('kanjou')

const ctx = createContext()

cli.command('generate', 'Generate locale .d.ts type declarations.').action(generate(ctx))

cli
  .command('compare', 'Cross-compare locale files and output missing keys for each.')
  .action(compare(ctx))

cli
  .command('missing', 'Find translation keys used in code but missing from locale files.')
  .action(missing(ctx))

cli
  .command('unused', 'Find keys in locale files that are not used in the code.')
  .action(unused(ctx))

cli.help()

cli.parse()

if (!cli.matchedCommand) cli.outputHelp()
