import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/vite.ts', 'src/webpack.ts', 'src/rspack.ts', 'src/esbuild.ts'],
  external: ['vite', 'webpack', '@rspack/core', 'esbuild', 'unplugin'],
  dts: { oxc: true },
})
