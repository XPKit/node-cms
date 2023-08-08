// vite.config.js

import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue2'
import _ from 'lodash'
import Components from 'unplugin-vue-components/vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import commonjs from 'vite-plugin-commonjs'
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

export default defineConfig({
  base: '/',
  plugins: [
    commonjs(),
    vue({
      exclude: 'os'
    }),
    Components({
      resolvers: [VuetifyResolver()]
    })
  ],
  optimizeDeps: {
    include: ['xlsx']
  },
  server: {
    origin: `http://localhost:${devPort}`,
    port: devPort,
    proxy: {
      '^/(cms|i18n|config|login|logout|resources)': {
        target: `http://localhost:${serverPort}/admin`,
        ws: true,
        changeOrigin: true
      },
      '^/admin/(fonts)': {
        target: `http://localhost:${devPort}`,
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => configure('^/admin/(fonts)', devPort, proxy, _options)
      },
      '^/(admin)': {
        target: `http://localhost:${serverPort}/admin`,
        ws: true,
        rewrite: (path) => path.replace(/^\/admin/, ''),
        changeOrigin: true,
        configure: (proxy, _options) => configure('^/(admin)$', serverPort, proxy, _options)
      },
      '^/(api)': {
        target: `http://localhost:${serverPort}`,
        ws: true,
        changeOrigin: true
      }
    }
  },
  transpileDependencies: [
    'vuetify'
  ],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      os: 'rollup-plugin-node-polyfills/polyfills/os',
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
  build: {
    manifest: true,
    rollupOptions: {
      external: [
        /node_modules/
      ],
      input: {
        main: path.resolve(__dirname, 'src/index.html'),
        login: path.resolve(__dirname, 'src/login.html')
      }
    }
  }
})
