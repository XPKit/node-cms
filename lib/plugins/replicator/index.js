/*
 * CMS Replication API exposed as plugin
 */
'use strict'

// const logger = new (require('img-sh-logger'))()
const _ = require('lodash')
const express = require('express')
const autoBind = require('auto-bind')

const Replicator = require('./replicator')
const ReplicatorMongoDb = require('./replicatorMongoDb')

const defaults = {
}

class ReplicatorManager {
  constructor (cms, options) {
    autoBind(this)
    this.cms = cms
    this.options = _.extend({}, defaults, options)
    this.cms.$replicator = this
    this.initialize()
  }

  initialize() {
    if (_.get(this.cms, 'options.dbEngine.type') === 'mongodb') {
      this.replicator = new ReplicatorMongoDb(this.cms)
    } else {
      this.replicator = new Replicator(this.cms)
    }
    // Mount API router
    const app = express()
    // List all resources, their type, and sync directions/peers
    app.get('/resources', this.onGetResources)
    // Trigger sync for all records of a resource
    app.post('/sync/:resource', this.onPostSyncResource)
    // Trigger sync for a specific record
    app.post('/sync/:resource/:id', this.onPostSyncRecord)
    this.cms._app.use('/replicator', app)
  }

  onGetResources(req, res) {
    const resources = _.map(this.cms._resources, (def, name) => {
      const type = _.get(def, 'type', 'normal')
      const peersByResource = _.get(this.cms.options, 'replication.peersByResource', {})
      const peers = _.get(peersByResource, name, _.get(this.cms.options, 'replication.peers', []))
      console.debug(`[Replicator] Resource: ${name}, Type: ${type}, Peers:`, peers)
      return {
        name,
        type,
        peers,
        direction: type === 'downstream' ? 'from peers' : type === 'upstream' ? 'to peers' : 'bi-directional'
      }
    })
    res.json(resources)
  }

  directionIsValid(type, peer) {
    return (type === 'upstream' && peer.direction === 'downstream') ||
        (type === 'downstream' && peer.direction === 'upstream') ||
        (type === 'normal') ||
        (peer.direction === 'normal')
  }

  async onPostSyncResource(req, res) {
    try {
      const { resource } = req.params
      const result = await this.syncResource(resource)
      res.json({ ok: true, result })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  async onPostSyncRecord(req, res) {
    try {
      const { resource, id } = req.params
      const result = await this.syncRecord(resource, id)
      res.json({ ok: true, result })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  }

  getParams(resourceName) {
    const resourceDef = this.cms._resources[resourceName]
    if (!resourceDef) {
      throw new Error(`Resource '${resourceName}' not found`)
    }
    const type = resourceDef.type || 'normal'
    const peersByResource = _.get(this.cms.options, 'replication.peersByResource', {})
    let peers = _.get(peersByResource, resourceName, undefined)
    if (!peers) {
      peers = _.get(this.cms.options, 'replication.peers', [])
    }
    console.debug(`[Replicator] getParams for resource: ${resourceName}, type: ${type}, peers:`, peers)
    if (!_.isArray(peers) || peers.length === 0) {
      throw new Error('No replication peers configured for resource ' + resourceName)
    }
    return {type, peers}
  }

  /**
   * Sync all records in a resource, direction-aware and peer-aware
   * @param {string} resourceName
   */
  async syncResource(resourceName) {
    const {type, peers} = this.getParams(resourceName)
    const results = []
    for (const peer of peers) {
      // peer: { url, direction: 'upstream'|'downstream'|'normal', resources: [...] }
      if (_.isArray(peer.resources) && !peer.resources.includes(resourceName)) {
        continue
      }
      // Only sync in allowed direction
      if (this.directionIsValid(type, peer)) {
        console.debug(`[Replicator] syncResource: resource=${resourceName}, peer=`, peer)
        // Call replicator.replicate for this peer
        try {
          const result = await this.replicator.replicate(peer.host, peer.port, peer.url, resourceName)
          results.push({ peer, status: 'ok', result })
        } catch (err) {
          results.push({ peer, status: 'error', error: err.message })
        }
      }
    }
    return { resource: resourceName, results }
  }

  /**
   * Sync a specific record in a resource, direction-aware and peer-aware
   * @param {string} resourceName
   * @param {string} recordId
   */
  async syncRecord(resourceName, recordId) {
    const {type, peers} = this.getParams(resourceName)
    const results = []
    for (const peer of peers) {
      if (_.isArray(peer.resources) && !peer.resources.includes(resourceName)) {
        continue
      }
      if (this.directionIsValid(type, peer)) {
        console.debug(`[Replicator] syncRecord: resource=${resourceName}, recordId=${recordId}, peer=`, peer)
        try {
          const result = await this.replicator.replicate(peer.host, peer.port, peer.url, resourceName, recordId)
          results.push({ peer, status: 'ok', result, recordId })
        } catch (err) {
          results.push({ peer, status: 'error', error: err.message, recordId })
        }
      }
    }
    return { resource: resourceName, recordId, results }
  }
}

exports = module.exports = ReplicatorManager
