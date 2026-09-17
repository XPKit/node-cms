import path from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Deliberately not vite.config.mjs: that one builds the admin, which means the plugin symlink, the
// vuetify auto-import and the rollup polyfills, none of which a unit test needs. Only the aliases
// src/ actually imports through are repeated here.
const src = (folder) => path.resolve(import.meta.dirname, 'src', folder)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@s': src('services'),
      '@c': src('components'),
      '@v': src('views'),
      '@u': src('utils'),
      '@l': src('lib'),
      '@m': src('mixins'),
      '@f': src('filters'),
      '@a': src('assets'),
      '@r': src('router'),
      '@static': src('static'),
      '@p': src('.plugins')
    }
  },
  test: {
    // The server-side unit tests under test/unit are mocha's; vitest owns the admin only.
    include: ['test/admin/**/*.test.js'],
    environment: 'happy-dom',
    restoreMocks: true
  }
})
