const path = require('path')
const _ = require('lodash')
const pkg = require('./package.json')
const { defineConfig } = require('@vue/cli-service')

const serverPort = _.get(pkg, 'config.port', 9990)
const devPort = 10000 + serverPort

module.exports = defineConfig({
  productionSourceMap: process.env.NODE_ENV !== 'production',
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      chunks: ['chunks-vendors', 'chunks-common', 'index']
    },
    login: {
      entry: 'src/main.js',
      template: 'public/login.html',
      chunks: ['chunks-vendors', 'chunks-common', 'login']
    }
  },
  configureWebpack: {
    resolve: {
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
    }
  },
  publicPath: '/admin',
  devServer: {
    historyApiFallback: {
      rewrites: [
        { from: /\/index/, to: '/index.html' },
        { from: /\/login/, to: '/login.html' }
      ]
    },
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
      '^/(admin)': {
        target: `http://localhost:${serverPort}/admin`,
        ws: true,
        pathRewrite: {
          '^/admin': ''
        },
        changeOrigin: true
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
  chainWebpack: config => {
    // .tap(args => {
    // .plugin('html')
    //   args[0].title = 'Node-cms'
    //   return args
    // })
    // config.module
    //   .rule('css')
    //   .test(/\.css$/)
    //   .use('style-loader')
    //   .loader('style-loader')
    //   .end()
    //   .use('css-loader')
    //   .loader('css-loader')
    //   .end()
    // config.module
    //   .rule('css')
    //   .test(/\.css$/)
    //   .use('resolve-url-loader')
    //   .loader('resolve-url-loader')
    //   .end()
    // .use('sass-loader')
    // .loader('sass-loader')
    // .tap(options => {
    //   options.sourceMap = true
    //   return options
    // })
  }
})
