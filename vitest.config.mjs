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
    // src/ imports components without an extension (`@c/SystemInfo`), which only resolves because
    // the build config lists .vue here. Coverage transforms every file, so it needs the same list.
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
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
    restoreMocks: true,
    // On by default so `npm run coverage` reports both halves from one command: c8 measures
    // lib/ and index.js around the whole run, and this measures src/ from inside it. The two
    // never overlap, because c8's --include list does not mention src/.
    coverage: {
      enabled: true,
      // istanbul, not v8: it instruments after vite's transform, so a .vue file that no test
      // imports is still counted. The v8 provider parses uncovered files as raw JS, chokes on
      // `<template>` and drops every untested component from the denominator — which would make
      // the number look better precisely where the coverage is worst.
      provider: 'istanbul',
      // Every src/ file, not only the ones a test happens to import: a file nobody tests is
      // exactly what the number is meant to show.
      all: true,
      include: ['src/**/*.{js,vue}'],
      exclude: [
        // A gitignored symlink the build creates, so it is not ours and is not always there.
        'src/plugins/**',
        'src/.plugins/**',
        // Vendored third-party source, carried verbatim with its own licence.
        'src/vendor/**'
      ],
      reporter: ['text-summary']
      // No thresholds on purpose: a gate set at today's number would only freeze it there.
    }
  }
})
