import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['./src/cli.ts'],
    dts: false,
  },
  {
    entry: ['./src/index.ts'],
    dts: { oxc: true },
  },
])
