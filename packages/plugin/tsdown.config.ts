import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/vite.ts', 'src/webpack.ts'],
  dts: { oxc: true },
})
