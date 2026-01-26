export default {
  entry: [
    // Main application entry points
    'src/main.js',
    // Resource files are dynamically loaded
    'resources/**/*.js',
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
  ],

  project: [
    'src/**/*.{js,ts,vue}',
    'lib/**/*.js',
    'lib-import/**/*.js',
    'lib-importFromRemote/**/*.js',
    'resources/**/*.js',
    'test/**/*.js',
    '*.js',
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
    // Files with dynamic exports that Knip can't properly analyze
    'lib/helpers.js',
    'lib/plugins/rest/routes.js',
    // Logger dependencies
    'lib/logger.js',
    // Plugin alias imports that Knip can't resolve
    '@p/js/main.js',
    '@p/scss/main.scss',
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
    '@p/*': ['src/plugins/*'],
  },

  ignoreDependencies: [
    // Vue component aliases not properly resolved by Knip (temporary workaround)
    '@c/SystemInfo',
    '@c/ResourceList',
    '@c/PreviewAttachment',
    '@c/Omnibar',
    '@c/ThemeSwitch',
    '@c/PreviewMultiple',
    '@c/FileInputErrors',
    // Logger dependencies used in lib/logger.js (which is ignored)
    'colors',
    'debug',
  ],

  // Ignore binaries that are referenced in package.json but not installed
  ignoreBinaries: ['ulimit', 'mongod'],
}
