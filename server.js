#!/usr/bin/env node

'use strict'

const express = require('express')

const CMS = require('./')
const pkg = require('./package.json')

const path = require('path')
const logger = new (require(path.join(__dirname, 'lib/logger')))()

// start with leveldb
let options = {
  // debug: true,
  apiVersion: 1
  // dbEngine: {
  //     type: 'mongodb',
  //     url: `${process.env.XPKIT_HOST || '127.0.0.1'}/node-cms`
  //   }
}

// // start with dbEngine
// let options = {
//   apiVersion: 1
//   // dbEngine: {
//   //   type: 'xpkit',
//   //   url: `${process.env.XPKIT_HOST || 'localhost'}/node-cms`
//   // }
// }

// start with mongo dbEngine
// let options = {
//   apiVersion: 2,
//   dbEngine: {
//     type: 'mongodb',
//     url: `${process.env.XPKIT_HOST || '127.0.0.1'}/node-cms`
//   }
// }

const cms = new CMS(options)

const app = express()
app.use(cms.express())
const server = app.listen(pkg.config.port, async () => {
  await cms.bootstrap(server)
  logger.info('########### server started ###########')
  return logger.info(`${pkg.name} started at http://localhost:${server.address().port}/admin`)
})

process.on('uncaughtException', (error) => {
  logger.error(error)
})
