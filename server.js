#!/usr/bin/env node

'use strict'

const express = require('express')
const Q = require('q')

const CMS = require('./')
const pkg = require('./package.json')

const logger = new (require('./lib/logger'))()

// start with leveldb
// let options = {
//   // debug: true,
//   apiVersion: 2,
//   xlsx: true,
//   import: {
//     oauth: {
//       email: 'view-edit-spreadsheets@sinuous-voice-178902.iam.gserviceaccount.com',
//       keyFile: 'view-edit-spreadsheets.pem'
//     },
//     createOnly: true,
//     gsheetId: '1ydmCIx42P9Tmxp50-Le3KV661DMdZKQYDdbuH354McA',
//     resources: [
//       'articles',
//       'themes',
//       'markets',
//       'dealerships'
//     ]
//   }
// }

// // start with dbEngine
// let options = {
//   apiVersion: 1
//   // dbEngine: {
//   //   type: 'xpkit',
//   //   url: `${process.env.XPKIT_HOST || 'localhost'}/node-cms`
//   // }
// }

// start with mongo dbEngine
let options = {
  apiVersion: 2,
  dbEngine: {
    type: 'mongodb',
    url: `${process.env.XPKIT_HOST || 'localhost'}/node-cms`
  }
}

const cms = new CMS(options)

const app = express()
app.use(cms.express())
const server = app.listen(pkg.config.port, async () => {
  await Q.ninvoke(cms, 'bootstrap')
  logger.info('########### server started #################')
  return logger.info(`${pkg.name} started at http://localhost:${server.address().port}/admin`)
})

process.on('uncaughtException', (error) => {
  logger.error(error)
})
