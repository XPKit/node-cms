// vite.config.js

import { defineConfig } from 'vite'
import path from 'path'
import _ from 'lodash'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import ViteUtils from './vite.utils.js'
import vuetify from 'vite-plugin-vuetify'
import rollupNodePolyFill from 'rollup-plugin-node-polyfills'
import { visualizer } from 'rollup-plugin-visualizer'

const viteUtils = ViteUtils.getInstance()

const defaultVendorsFilename = 'vendors'
const separatedVendors = ['lodash', 'vuetify', '@json-editor', '@tiptap', 'codemirror']
const regroupModulesStartingWith = ['vue', 'prosemirror']

const cacheControl = () => ({
  name: 'cache-control',
  configureServer (server) {
    server.middlewares.use((req, res, next) => {
      const cachedPaths = [
        '/assets/',
        '/api/file/'
      ]
      for (const cachedPath of cachedPaths) {
        if (req.originalUrl.search(cachedPath) > -1) {
          res.setHeader('Cache-Control', 'public,max-age=31536000,immutable')
        } else {
          res.setHeader('Cache-Control', 'public,max-age=0')
          res.setHeader('Pragama', 'no-cache')
        }
      }
      next()
    })
  }
})

export default defineConfig(({ mode }) => {
  return {
    root: mode === 'development' ? __dirname : viteUtils.nodeCmsSrcPath,
    base: './',
    publicDir: `${mode === 'development' ? '.' : '..'}/public`,
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler' // or "modern"
        }
      }
    },
    plugins: [
      cacheControl(),
      vue({exclude: 'os'}),
      vueJsx({}),
      vuetify({ autoImport: true }),
      visualizer()
    ],
    server: viteUtils.serverConfig,
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      alias: viteUtils.resolveAliases({
        events: 'rollup-plugin-node-polyfills/polyfills/events',
        stream: 'rollup-plugin-node-polyfills/polyfills/stream',
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
      chunkSizeWarningLimit: 1500,
      minify: true,
      cssCodeSplit: false,
      manifest: false,
      outDir: '../dist',
      rollupOptions: {
        plugins: [
          // Enable rollup polyfills plugin
          // used during production bundling
          rollupNodePolyFill()
        ],
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules') && !id.includes('node-cms/src')) {
              const moduleName = _.get(path.dirname(id).split('/node_modules/').pop().split('/'), '[0]', false)
              if (!moduleName) {
                return defaultVendorsFilename
              }
              const shouldRegroupModule = _.find(regroupModulesStartingWith, (startingWith) => id.includes(startingWith))
              if (!_.isUndefined(shouldRegroupModule)) {
                return shouldRegroupModule
              }
              const foundSeperatedVendor = _.find(separatedVendors, (separatedVendor) => id.includes(`node_modules/${separatedVendor}`))
              return !_.isUndefined(foundSeperatedVendor) ? moduleName : defaultVendorsFilename
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
