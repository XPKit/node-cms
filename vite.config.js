// vite.config.js

import { defineConfig, splitVendorChunkPlugin } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import ViteUtils from './vite.utils.js'
import vuetify from 'vite-plugin-vuetify'

const viteUtils = ViteUtils.getInstance()

export default defineConfig(({ command, mode, ssrBuild }) => {
  return {
    root: mode === 'development' ? __dirname : viteUtils.nodeCmsSrcPath,
    base: './',
    publicDir: `${mode === 'development' ? '.' : '..'}/public`,
    plugins: [
      vue({exclude: 'os'}),
      vueJsx({}),
      vuetify({ autoImport: true }),
      splitVendorChunkPlugin()
    ],
    server: viteUtils.serverConfig,
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      alias: viteUtils.resolveAliases({
        os: 'rollup-plugin-node-polyfills/polyfills/os',
        '@s': 'services',
        '@p': viteUtils.isInNodeModules ? path.resolve('../../node-cms/plugins') : 'plugins',
        '@static': 'static',
        '@a': 'assets',
        '@c': 'components',
        '@v': 'views',
        '@f': 'filters',
        '@u': 'utils',
        '@l': 'lib',
        '@r': 'router',
        '@m': 'mixins'
      })
    },
    preview: viteUtils.serverConfig,
    optimizeDeps: {
      include: ['dayjs/plugin/relativeTime', 'fuzzysort']
    },
    build: {
      minify: true,
      cssCodeSplit: false,
      manifest: false,
      outDir: '../dist',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules') && !id.includes('node-cms/src')) {
              return 'vendor'
            }
            return null
          }
        },
        input: {
          main: path.resolve(viteUtils.nodeCmsSrcPath, 'index.html')
        }
      }
    }
  }
})
