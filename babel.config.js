module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      [
        '@babel/preset-env', {
          'useBuiltIns': 'usage',
          'corejs': 3
        }
      ],
      '@babel/preset-react'
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties',
      '@babel/plugin-proposal-export-default-from',
      '@babel/plugin-transform-regenerator',
      '@babel/plugin-transform-runtime'
    ],
    sourceMaps: true,
    compact: true
  }
}
