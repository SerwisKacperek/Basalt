import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      'dist',
      '.turbo',
      '.next',
      '.vitepress',
      'dist-electron',
    ],
    environment: 'node',
    passWithNoTests: true,
    testTimeout: 10000,
  },
})
