import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/server.ts', 'src/index.ts'],
  dts: { oxc: true },
})
