import { defineConfig } from '@kanjou/cli'

export default defineConfig({
  localesDir: './src/assets/locales',
  baseLocale: 'en',
  dts: { outDir: './generated' },
  format: {
    singleQuote: true,
    printWidth: 100,
    semi: false,
  },
})
