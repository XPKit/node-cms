const _ = require('lodash')
const fs = require('fs-extra')
const path = require('path')
const express = require('express')
const { spawn } = require('child_process')
const logger = new (require('img-sh-logger'))()
const { getCMSInstance, options: cmsOptions } = require('./cmsInstance')
const pkg = require('../package.json')

// Define resources that should be public for anonymousRead tests
const publicResources = ['publicData']

// Clean test data directory before CMS initialization
fs.removeSync('./test/data')

// Modify CMS options to include anonymousRead plugin and public resources
const options = {
  ...cmsOptions,
  anonymousRead: publicResources
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

// TODO: hugo - change the way the unit tests are being run, only 1 instance of node-cms should be started except for the replication/sync/import tests which need several node-cms instances running at the same time


// Peer process management for replication tests
const peerPorts = [9991, 9992]
const peerProcesses = []
const serverPath = path.join(__dirname, 'server.js')
let started = 0

// Helper to get a random available port in range 9000-9999
function getRandomPort() {
  return Math.floor(Math.random() * 1000) + 9000
}

const runPeerTests = process.env.RUN_PEER_TESTS === '1'

function launchPeers(done) {
  if (_.get(process, 'env.NODE_CMS_OVERRIDE_CONFIG', false)) {
    // If this is a peer, do not launch more peers
    done && done()
    return
  }
  // Use random ports for peers to avoid conflicts
  const usedPorts = new Set([port])
  function getUniquePort() {
    let p
    do {
      p = getRandomPort()
    } while (usedPorts.has(p))
    usedPorts.add(p)
    return p
  }
  for (let i = 0; i < peerPorts.length; i++) {
    const peerPort = getUniquePort()
    // Clone config for each peer
    const peerConfig = JSON.parse(JSON.stringify(options))
    peerConfig.port = peerPort
    peerConfig.replication = peerConfig.replication || {}
    peerConfig.replication.peers = []
    // Always set peersByResource for all servers
    peerConfig.replication.peersByResource = {
      articles: [`http://localhost:${peerPort}`],
      authors: [`http://localhost:${peerPort}`]
    }
    // Use a separate resource directory for each peer
    const path = require('path')
    peerConfig.resources = path.join(__dirname, `resources-peer-${peerPort}`)
    // Clean peer data directory before starting
    const peerDataDir = path.join(__dirname, `data-peer-${peerPort}`)
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

function killPeers() {
  for (const proc of peerProcesses) {
    if (_.get(proc, 'id', false) && proc.pid) {
      try {
        proc.kill('SIGKILL')
      } catch (error) {
        console.error(`Error killing peer process ${proc.pid}: ${error.message}`)
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

const spawnArgs = ['mocha', '--exit', '-R', 'spec', '-b', '-t', '40000', '--timeout', '60000', './test/runTests.js']

function spawnRunTests(withPeers = false) {
  const testProcess = spawn('npx', spawnArgs, { stdio: 'inherit', shell: true })
  testProcess.on('exit', (code) => {
    logger.info(`Test process exited with code ${code}`)
    if (withPeers) {
      killPeers()
    }
    process.exit(code)
  })
}

const port = runPeerTests ? getRandomPort() : 9990
console.warn('will create CMS with options: ', options)
const cms = getCMSInstance(options)
cms.options.port = port
const app = express()
app.use(cms.express())
if (runPeerTests) {
  return launchPeers(() => {
    const server = app.listen(port, async () => {
      await cms.bootstrap(server)
      logger.info('########### server started ###########')
      logger.info(`${pkg.name} started at http://localhost:${server.address().port}/admin`)
      if (!_.get(process, 'env.NODE_CMS_OVERRIDE_CONFIG', false)) {
        spawnRunTests(true)
      }
    })
  })
}
const server = app.listen(port, async () => {
  await cms.bootstrap(server)
  logger.info('########### server started ###########')
  logger.info(`${pkg.name} started at http://localhost:${server.address().port}/admin`)
  spawnRunTests()
})

