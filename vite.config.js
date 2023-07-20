// vite.config.js

import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue2'
import _ from 'lodash'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import commonjs from 'vite-plugin-commonjs'
import Components from 'unplugin-vue-components/vite'
import pkg from './package.json'
const serverPort = _.get(pkg, 'config.port', 9990)
const devPort = 10000 + serverPort

export default defineConfig({
  productionSourceMap: process.env.NODE_ENV !== 'production',
  base: '/admin',
  plugins: [
    commonjs(),
    vue(),
    Components({
      resolvers: [VuetifyResolver()]
    })
  ],
  input: {
    login: path.resolve(__dirname, './login.html'),
    main: path.resolve(__dirname, 'index.html')
  },
  server: {
    port: devPort,
    proxy: {
      '^/(cms|i18n|config|login|resources)': {
        target: `http://localhost:${serverPort}/admin`,
        ws: true,
        changeOrigin: true
      },
      '^/(admin/fonts)': {
        target: `http://localhost:${devPort}`,
        ws: true,
        changeOrigin: true
      },
      // '^/(admin)': {
      //   target: `http://localhost:${serverPort}/admin`,
      //   ws: true,
      //   rewrite: (path) => path.replace(/^\/admin/, ''),
      //   changeOrigin: true
      // },
      // '^/(admin).*(?<!html)$': {
      //   target: `http://localhost:${serverPort}/admin`,
      //   ws: true,
      //   rewrite: (path) => path.replace(/^\/admin/, ''),
      //   changeOrigin: true
      // },

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
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        login: path.resolve(__dirname, 'login.html')
      }
    }
  }
})
