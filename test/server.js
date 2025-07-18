#!/usr/bin/env node

'use strict'

const fs = require('fs-extra')
const express = require('express')
const { spawn } = require('child_process')
const logger = new (require('img-sh-logger'))()
const CMS = require('../')
const pkg = require('../package.json')

fs.removeSync('./test/data')

let options = {
  ns: [],
  resources: './test/resources',
  data: './test/data',
  autoload: true,
  mode: 'normal',
  mid: '42424242',
  disableREST: false,
  disableAdmin: false,
  mountPath: '/',
  disableJwtLogin: false,
  disableAuthentication: true,
  wsRecordUpdates: true,
  auth: {
    secret: '$C&F)J@NcRfUjXn2r5u8x/A?D*G-KaPd'
  },
  disableAnonymous: false,
  session: {
    secret: 'MdjIwFRi9ezT',
    resave: true,
    saveUninitialized: true
  },
  syslog: {
    method: 'file',
    path: './syslog.log'
  },
  smartCrop: false,
  defaultPaging: 12,
  test: true
}

const cms = new CMS(options)

const app = express()
app.use(cms.express())
const server = app.listen(pkg.config.port, async () => {
  await cms.bootstrap(server)
  logger.info('########### server started ###########')
  logger.info(`${pkg.name} started at http://localhost:${server.address().port}/admin`)
  // Launch all tests after server is ready
  const testProcess = spawn('npx', ['mocha', '--exit', '-R', 'spec', '-b', '-t', '40000', '--timeout', '60000', './test/runTests.js'], {
    stdio: 'inherit',
    shell: true
  })
  testProcess.on('exit', (code) => {
    logger.info(`Test process exited with code ${code}`)
    process.exit(code)
  })
})

process.on('uncaughtException', (error) => {
  logger.error(error)
})
