import { defineConfig } from '@kanjou/cli'

export default defineConfig({
  baseLocale: 'en',
  localesDir: './src/assets/locales',
  dts: { outDir: './generated/kanjou' },
  prettier: {
    singleQuote: true,
    printWidth: 100,
    semi: false,
  },
})
