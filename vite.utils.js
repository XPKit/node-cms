const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const crypto = require('crypto')


class ViteUtils {
  constructor () {
    this.isInNodeModules = __dirname.includes('/node_modules/node-cms') || __dirname.includes('\\node_modules\\node-cms')
    this.rootPath = path.join(__dirname, this.isInNodeModules ? '../../' : './')
    const pkgPath = path.join(this.rootPath, 'package.json')
    const pkg = require(pkgPath)
    this.serverPort = _.get(pkg, 'config.port', 9990)
    this.devPort = 10000 + this.serverPort
    this.baseUrl = 'http://localhost'
    this.websocketBaseUrl = 'ws://localhost'
    this.nodeCmsMountPath = _.get(pkg, 'config.mountPath', '/')
    console.log(`Node-cms mount path is: ${this.nodeCmsMountPath}`)
    this.nodeCmsSrcPath = path.resolve(__dirname, 'src')
    this.plugins = {
      toBuild: path.resolve(this.nodeCmsSrcPath, 'plugins'),
      source: path.resolve(this.rootPath, 'node-cms', 'plugins'),
      fallback: path.resolve(this.nodeCmsSrcPath, '.plugins')
    }

    this.createPluginsSymlink()

    this.serverConfig = {
      origin: `${this.baseUrl}:${this.devPort}`,
      port: this.devPort,
      proxy: this.getProxy(),
      compress: false,
      fs: {
        allow: ['..'] // Allow serving files from one level up to the project root
      }
    }
  }

  getAliasPath = (folderPath) => {
    return path.resolve(this.nodeCmsSrcPath, folderPath)
  }

  /**
   * @param  {Object} aliasesMapping Configuration object for all vite aliases to resolve. All aliases starting with '@' will be prefixed with the node-cms src path
   * @returns {Object} All aliases with resolved paths
   */
  resolveAliases = (aliasesMapping) => {
    return _.mapValues(aliasesMapping, (val, key) => _.startsWith(key, '@') ? this.getAliasPath(val) : val)
  }

  createPluginsSymlink = () => {
    // Skip symlink creation during static analysis tools like knip
    if (process.argv.some(arg => arg.includes('knip') || arg.includes('eslint'))) {
      console.log('Skipping symlink creation during static analysis')
      return
    }

    console.log(`Node-cms is loaded ${this.isInNodeModules ? 'as a dependency' : 'directly'}`)
    if (fs.existsSync(this.plugins.fallback) === false) {
      throw new Error(`No .plugins folder found @ ${this.plugins.fallback}`)
    }
    if (fs.existsSync(path.join(this.plugins.toBuild, 'js/main.js'))) {
      console.log(`Found plugins folder symlink @ ${this.plugins.toBuild}`)
      fs.unlinkSync(this.plugins.toBuild)
    }
    if (!(this.isInNodeModules && fs.existsSync(this.plugins.source))) {
      console.log(`Will use fallback path ${this.plugins.fallback}`)
      this.plugins.source = this.plugins.fallback
    }
    fs.symlinkSync(this.plugins.source, this.plugins.toBuild)
    console.log(`Symlink created @ ${this.plugins.toBuild} -> ${this.plugins.source}`)
  }

  handleProxyCall = (proxyRoute, proxy) => {
    proxy.on('error', (err) => {
      console.error(`${proxyRoute} - Proxy error`, err)
    })
    // proxy.on('proxyReq', (proxyReq, req, _res) => {
    //   console.log(`${proxyRoute} - Sending Request to the Target:`, req.method, req.url)
    // })
    // proxy.on('proxyRes', (proxyRes, req, _res) => {
    //   console.log(`${proxyRoute} - Received Response from the Target:`, proxyRes.statusCode, req.url)
    // })
  }

  getProxy = () => {
    this.proxy = {}
    const regex = new RegExp(`^${this.nodeCmsMountPath}admin`, 'g')
    const target = `${this.baseUrl}:${this.serverPort}${this.nodeCmsMountPath}admin`
    _.set(this.proxy, `^${this.nodeCmsMountPath}(cms|i18n|config|login|logout|resources)`, {
      target
    })
    _.set(this.proxy, `^${this.nodeCmsMountPath}admin/(fonts)`, {
      target,
      configure: (proxy) => this.handleProxyCall(`^${this.nodeCmsMountPath}admin/(fonts)`, proxy)
    })
    _.set(this.proxy, `^${this.nodeCmsMountPath}(admin)`, {
      target,
      rewrite: (path) => path.replace(regex, ''),
      configure: (proxy) => this.handleProxyCall(`^${this.nodeCmsMountPath}(admin)`, proxy)
    })
    _.set(this.proxy, `^${this.nodeCmsMountPath}(api|import|importFromRemote|sync)`, {
      target: `${this.baseUrl}:${this.serverPort}`
    })
    _.set(this.proxy, '^/(socket)', {
      target: `${this.baseUrl}:${this.serverPort}`,
      configure: (proxy) => this.handleProxyCall(`${this.baseUrl}:${this.serverPort}`, proxy)
    })
    _.set(this.proxy, '^/(_updates)', {
      target: `${this.websocketBaseUrl}:${this.serverPort}`,
      configure: (proxy) => this.handleProxyCall(`${this.baseUrl}:${this.serverPort}`, proxy)
    })
    if (this.isInNodeModules && this.nodeCmsMountPath !== '/') {
      _.set(this.proxy, '^/(api)', {
        target: `${this.baseUrl}:${this.serverPort}`
      })
    }
    _.each(this.proxy, (route) => {
      route.ws = true
      route.changeOrigin = true
    })
    // console.info('Proxy is', this.proxy)
    return this.proxy
  }
}

module.exports = {
  self: null,
  id: null,
  getInstance (baseUrl, pkg) {
    if (this.self === null) {
      this.id = crypto.randomUUID()
      this.self = new ViteUtils(baseUrl, pkg)
    }
    return this.self
  }
}
