#!/usr/bin/env node

const express = require('express')

const CMS = require('./')
const pkg = require('./package.json')
const logger = new (require('img-sh-logger'))()
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
//   //   type: 'mongodb',
//   //   url: `127.0.0.1/node-cms`
//   // }
// }

let options = {
  sync: {
    resources: ['articles','comments','authors']
  },
  disableReplication: true,
  smartCrop: true,
  dbEngine: {
    type: 'mongodb',
    url: '127.0.0.1/node-cms'
  }
  //   "syslog": {
  //   "method": "file",
  //   "path": "syslog.log"
  // },
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
