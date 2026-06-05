import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

const external = ['electron', 'better-sqlite3']

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: { main: resolve(__dirname, 'src/main.ts') },
        output: { entryFileNames: '[name].js', format: 'cjs' },
        external,
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist',
      emptyOutDir: false,
      rollupOptions: {
        input: { preload: resolve(__dirname, 'src/preload.ts') },
        output: { entryFileNames: '[name].js', format: 'cjs' },
        external,
      },
    },
  },
})
