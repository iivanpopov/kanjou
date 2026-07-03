import { kanjou } from '@kanjou/react'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [kanjou(), react()],
})
