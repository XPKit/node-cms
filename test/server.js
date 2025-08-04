#!/usr/bin/env node

const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
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
  test: true,
  replication: {
    peers: [9991, 9992],
    peersByResource: {
      articles: ['http://localhost:9991'],
      authors: ['http://localhost:9992']
    }
  }
}

/*
node-cms A
  config: {
    peersByResource: {
      markets: ['http://localhost:9991'],
    }
  }
  markets resource: {
    type: 'downstream'
  }

node-cms B
  config: {
    peersByResource: {
      markets: ['http://localhost:9991', 'http://localhost:9993'],
    }
  }
  markets resource: {
    type: 'upstream'
  }

*/


if (process.env.NODE_CMS_OVERRIDE_CONFIG) {
  try {
    options = JSON.parse(process.env.NODE_CMS_OVERRIDE_CONFIG)
  } catch (err) {
    logger.error('Failed to parse NODE_CMS_OVERRIDE_CONFIG:', err)
  }
}

const cms = new CMS(options)

// Peer process management for replication tests
const peerPorts = [9991, 9992]
const peerProcesses = []
const serverPath = path.join(__dirname, 'server.js')
let started = 0

function launchPeers(done) {
  if (_.get(process, 'env.NODE_CMS_OVERRIDE_CONFIG', false)) {
    // If this is a peer, do not launch more peers
    done && done()
    return
  }
  for (const port of peerPorts) {
    // Clone config for each peer
    const peerConfig = JSON.parse(JSON.stringify(options))
    peerConfig.port = port
    peerConfig.replication = peerConfig.replication || {}
    peerConfig.replication.peers = peerPorts.filter(p => p !== port).map(p => `http://localhost:${p}`)
    // Always set peersByResource for all servers
    peerConfig.replication.peersByResource = {
      articles: ['http://localhost:9991'],
      authors: ['http://localhost:9992']
    }

    // Use a separate resource directory for each peer
    const path = require('path')
    peerConfig.resources = path.join(__dirname, `resources-peer-${port}`)

    // Clean peer data directory before starting
    const peerDataDir = path.join(__dirname, `data-peer-${port}`)
    fs.removeSync(peerDataDir)
    peerConfig.data = peerDataDir

    const proc = spawn('node', ['--no-deprecation', serverPath], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        NODE_CMS_OVERRIDE_CONFIG: JSON.stringify(peerConfig)
      },
      stdio: 'inherit',
      shell: true
    })
    peerProcesses.push(proc)
    proc.on('spawn', () => {
      started++
      if (started === peerPorts.length) {
        // Wait a bit for servers to be ready
        setTimeout(() => done && done(), 3000)
      }
    })
  }
}

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    console.error('Error:', error)
    return false
  }
}

function killPeers() {
  for (const proc of peerProcesses) {
    if (proc && proc.pid && isProcessRunning(proc.pid)) {
      try {
        console.warn('Will kill sub process --------', proc.pid)
        proc.kill('SIGKILL')
      } catch (error) {
        console.error(`Error killing peer process: ${error.message}`)
      }
    }
  }
}

process.on('SIGINT', () => {
  killPeers()
  process.exit(1)
})
process.on('SIGTERM', () => {
  killPeers()
  process.exit(1)
})
process.on('exit', () => {
  killPeers()
})

const app = express()
app.use(cms.express())
const port = _.get(options, 'port', pkg.config.port)

launchPeers(() => {
  const server = app.listen(port, async () => {
    await cms.bootstrap(server)
    logger.info('########### server started ###########')
    logger.info(`${pkg.name} started at http://localhost:${server.address().port}/admin`)
    // Launch all tests after server is ready
    if (!_.get(process, 'env.NODE_CMS_OVERRIDE_CONFIG', false)) {
      const testProcess = spawn('npx', ['mocha', '--exit', '-R', 'spec', '-b', '-t', '40000', '--timeout', '60000', './test/runTests.js'], {
        stdio: 'inherit',
        shell: true
      })
      testProcess.on('exit', (code) => {
        logger.info(`Test process exited with code ${code}`)
        killPeers()
        process.exit(code)
      })
    }
  })
})

process.on('uncaughtException', (error) => {
  logger.error(error)
})
