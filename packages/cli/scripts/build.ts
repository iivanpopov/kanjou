void Bun.build({
  entrypoints: ['./src/cli.ts'],
  outdir: './dist',
  target: 'node',
  banner: '#!/usr/bin/env node',
  minify: true,
})
