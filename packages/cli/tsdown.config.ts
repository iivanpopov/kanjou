import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['./src/cli.ts'],
    dts: { oxc: true },
    banner: '#!/usr/bin/env node',
  },
  {
    entry: ['./src/index.ts'],
    dts: { oxc: true },
  },
])
