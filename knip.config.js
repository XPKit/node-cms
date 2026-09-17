export default {
  entry: [
    // Main application entry points
    'src/main.js',
    // Resource files are dynamically loaded
    'resources/**/*.js',
    'docs/resourceExamples/**/*.js',
    // Plugins that are conditionally loaded based on options
    'lib/plugins/rest/index.js',
    'lib/plugins/admin/index.js',
    'lib/plugins/anonymousRead/index.js',
    'lib/plugins/authentication/index.js',
    'lib/plugins/replicator/index.js',
    'lib/plugins/rest/index.js',
    'lib/plugins/sync/index.js',
    'lib/plugins/xlsx/index.js',
    'lib/plugins/import/index.js',
    'lib/plugins/importFromRemote/index.js',
    // Test files may be run individually
    'test/**/*.js',
    // Standalone scripts, run by hand rather than imported
    'smartcrop-api.js',
    'compare-preload-jsons.js'
  ],
  project: [
    'src/**/*.{js,ts,vue}',
    'lib/**/*.js',
    'lib-import/**/*.js',
    'lib-importFromRemote/**/*.js',
    'resources/**/*.js',
    'docs/resourceExamples/**/*.js',
    'test/**/*.js',
    '*.{js,mjs}'
  ],
  ignore: [
    'cached/**',
    'data/**',
    'logs/**',
    'public/**',
    'ssl/**',
    'docs/**',
    'i18n/**',
    'node_modules/**',
    'dist/**',
    // Files we know are unused but want to keep
    'src/.plugins/js/main.js',
    // Type definitions for the JSDoc in index.js, which links to it rather than importing it
    'lib/jsdoc-types.js',
    // Files with dynamic exports that Knip can't properly analyze
    'lib/helpers.js',
    'lib/plugins/rest/routes.js'
  ],
  // Path mapping to resolve Vite aliases
  paths: {
    '@c/*': ['src/components/*'],
    '@v/*': ['src/views/*'],
    '@s/*': ['src/services/*'],
    '@u/*': ['src/utils/*'],
    '@f/*': ['src/filters/*'],
    '@l/*': ['src/lib/*'],
    '@r/*': ['src/router/*'],
    '@m/*': ['src/mixins/*'],
    '@a/*': ['src/assets/*'],
    '@static/*': ['src/static/*'],
    // src/plugins is a gitignored symlink that vite.utils.mjs creates at build time and skips during
    // static analysis, so resolve the alias to the committed fallback it points at instead.
    '@p/*': ['src/.plugins/*']
  },
  ignoreDependencies: [
    // Vue component aliases not properly resolved by Knip (temporary workaround)
    '@c/SystemInfo',
    '@c/ResourceList',
    '@c/PreviewAttachment',
    '@c/Omnibar',
    '@c/ThemeSwitch',
    '@c/PreviewMultiple',
    '@c/FileInputErrors'
  ],
  // Ignore binaries that are referenced in package.json but not installed
  ignoreBinaries: ['ulimit', 'mongod']
}
