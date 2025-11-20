import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: [],
    environment: 'happy-dom',
    browser: {
      provider: 'webdriverio',
      enabled: true,
      name: 'chrome',
    },
  },
})
