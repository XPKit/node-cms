#!/usr/bin/env node

import express from 'express'
import { createRequire } from 'module'

import CMS from './index.js'
// Import logger as a constructor
import Logger from 'img-sh-logger'

// For compatibility with JSON imports
const require = createRequire(import.meta.url)
const pkg = require('./package.json')
const logger = new Logger()

// start with leveldb
// let options = {
//   // debug: true,
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
//   // dbEngine: {
//   //   type: 'xpkit',
//   //   url: `${process.env.XPKIT_HOST || 'localhost'}/node-cms`
//   // }
// }

let options = {
  sync: {
    resources: ['articles','comments','authors']
  },
  disableReplication: true,
  dbEngine: {
    type: 'mongodb',
    url: `${process.env.XPKIT_HOST || '127.0.0.1'}/node-cms`
  }
}

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
