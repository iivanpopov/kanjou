import { kanjou } from '@kanjou/react/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    kanjou({
      localesDir: './src/locales',
      // baseLocale is used as a source of truth for generating typescript types
      baseLocale: 'en',
      dtsPath: './generated/locales.d.ts',
    }),
    react(),
  ],
})
