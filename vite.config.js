// vite.config.js

import { defineConfig, splitVendorChunkPlugin } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue2'
import vueJsx from '@vitejs/plugin-vue2-jsx'
import _ from 'lodash'
import Components from 'unplugin-vue-components/vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import pkg from './package.json'
const serverPort = _.get(pkg, 'config.port', 9990)
const devPort = 10000 + serverPort

const configure = (proxyRoute, proxyPort, proxy, _options) => {
  proxy.on('error', (err, _req, _res) => {
    console.error(`${proxyRoute} - Proxy error`, err)
  })
  // proxy.on('proxyReq', (proxyReq, req, _res) => {
  //   console.log(`${proxyRoute} - Sending Request to the Target:`, req.method, req.url)
  // })
  // proxy.on('proxyRes', (proxyRes, req, _res) => {
  //   console.log(`${proxyRoute} - Received Response from the Target:`, proxyRes.statusCode, req.url)
  // })
}

const baseUrl = 'http://localhost'

const proxy = {
  '^/(cms|i18n|config|login|logout|resources)': {
    target: `${baseUrl}:${serverPort}/admin`
  },
  '^/admin/(fonts)': {
    target: `${baseUrl}:${devPort}`,
    configure: (proxy, _options) => configure('^/admin/(fonts)', devPort, proxy, _options)
  },
  '^/(admin)': {
    target: `${baseUrl}:${serverPort}/admin`,
    rewrite: (path) => path.replace(/^\/admin/, ''),
    configure: (proxy, _options) => configure('^/(admin)$', serverPort, proxy, _options)
  },
  '^/(api)': {
    target: `${baseUrl}:${serverPort}`
  }
}
_.each(proxy, (route) => {
  route.ws = true
  route.changeOrigin = true
})

export default defineConfig(({ command, mode, ssrBuild }) => {
  return {
    root: mode === 'development' ? __dirname : path.resolve(__dirname, 'src'),
    base: './',
    publicDir: `${mode === 'development' ? '.' : '..'}/public`,
    plugins: [
      splitVendorChunkPlugin(),
      vueJsx({}),
      vue({exclude: 'os'}),
      Components({
        resolvers: [VuetifyResolver()]
      })
    ],
    optimizeDeps: {
      // include: []
    },
    server: {
      origin: `${baseUrl}:${devPort}`,
      port: devPort,
      proxy
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      alias: {
        os: 'rollup-plugin-node-polyfills/polyfills/os',
        // 'vue': path.resolve(__dirname, 'node_modules/vue'),
        // 'vuetify': path.resolve(__dirname, 'node_modules/vuetify'),
        '@s': path.resolve(__dirname, 'src/services'),
        '@static': path.resolve(__dirname, 'src/static'),
        '@a': path.resolve(__dirname, 'src/assets'),
        '@c': path.resolve(__dirname, 'src/components'),
        '@v': path.resolve(__dirname, 'src/views'),
        '@f': path.resolve(__dirname, 'src/filters'),
        '@u': path.resolve(__dirname, 'src/utils'),
        '@l': path.resolve(__dirname, 'src/lib'),
        '@r': path.resolve(__dirname, 'src/router'),
        '@m': path.resolve(__dirname, 'src/mixins')
      }
    },
    preview: {
      port: devPort,
      proxy
    },
    build: {
      // minify: false,
      cssCodeSplit: false,
      manifest: true,
      outDir: '../dist',
      rollupOptions: {
        // external: ['vue', 'vuetify'],
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          }
        },
        input: {
          main: path.resolve(__dirname, 'src/index.html')
        }
      }
    }
  }
})
