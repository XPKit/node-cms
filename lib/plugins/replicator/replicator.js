const _ = require('lodash')
const through = require('through')
const crypto = require('crypto')
const pAll = require('p-all')
const logger = new (require('img-sh-logger'))()
const { Readable } = require('stream')
const protocol = require('./protocol')

async function syncAttachment (resource, baseUrl) {
  logger.info('start syncing attachments ... ...')
  const result = await resource.list()
  // const attachmentList = _.reduce(result, (memo, item) => _.union(memo, item._attachments), [])
  const attachmentList = _.compact(_.flatten(_.map(result, '_attachments')))
  const downloadList = []
  await pAll(_.map(attachmentList, attachment => {
    return async () => {
      const exists = resource.file.exists(attachment._id)
      if (!exists) {
        downloadList.push({
          baseUrl,
          resource,
          name: resource.name,
          aid: attachment._id
        })
      } else {
        const stream = resource.file.read(attachment._id)
        const digester = crypto.createHash('md5')
        const digest = through((data) => {
          digester.update(data, 'hex')
        }, () => {
          const md5sum = digester.digest('hex')
          if (md5sum !== attachment._md5sum) {
            downloadList.push({
              baseUrl,
              resource,
              name: resource.name,
              aid: attachment._id
            })
          }
        })
        stream.pipe(digest)
      }
    }
  }), {concurrency: 10})
  let count = 0
  await pAll(_.map(downloadList, item => {
    return async () => {
      logger.info(`downloading file ${item.aid} ... ... `)
      await downloadAttachment(item.resource, item.baseUrl, item.name, item.aid)
      count++
      logger.info(`downloading file ${item.aid} ... ... done ( ${count} / ${downloadList.length} )`)
    }
  }), {concurrency: 10})
  await resource.file.cleanAttachment()
}

async function downloadAttachment (resource, baseUrl, name, aid) {
  const url = `${baseUrl + name}/file/${aid}`
  try {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
    } catch (error) {
      logger.warn(`downloading file ${aid} ... ... miss`, error)
      return
    }

    const response = await fetch(url)
    return new Promise((resolve, reject) => {
      const readable = Readable.from(response.body)
      readable
        .pipe(resource.file.write(aid))
        .on('finish', () => {
          resolve()
        }).on('error', (error) => {
          resource.file.remove(aid)
          reject(new Error(`downloading file ${aid} ... ... error, ${error}`))
        })
    })
  } catch (error) {
    resource.file.remove(aid)
    throw new Error(`downloading file ${aid} ... ... error, ${error}`)
  }
}

class Replicator {
  constructor (cms) {
    this.cms = cms
    /* Documents Replication */
    if (cms.options.netPort) {
      protocol.Server(cms.options.netPort, cms.options.mid, async (error, socket, name) => {
        if (error) {
          return logger.info('SERVER ERROR:', error)
        }
        const no = await this.cms.resource(name).json.cleanIndex()
        if (no > 0) {
          logger.info(`${name}: cleaned ${no} index`)
        }
        await this.cms.resource(name).json.sync(socket, false, null)
      })
    }
  }

  resource(name) {
    return this.cms.resource(name)
  }

  /**
   * Replicate a resource, optionally a specific recordId
   * @param {string} host
   * @param {number} port
   * @param {string} baseUrl
   * @param {string} name
   * @param {function} cb
   * @param {string} [recordId]
   */
  async replicate (host, port, baseUrl, name, recordId) {
    const resource = this.resource(name)

    // Convert protocol.Client callback to Promise
    const [socket] = await new Promise((resolve, reject) => {
      protocol.Client(host, port, name, this.options.mid, (error, socket, id) => {
        if (error) {
          reject(error)
        } else {
          resolve([socket, id])
        }
      })
    })

    // sync json (optionally filter by recordId)
    if (recordId) {
      // Only sync the specific record (if supported by resource.json.sync)
      await resource.json.sync(socket, true, null, recordId)
    } else {
      await resource.json.sync(socket, true, null)
    }
    // sync attachment (optionally filter by recordId)
    let funcs = []
    const { EntryStream } = require('level-read-stream')
    return new EntryStream(resource.json._db, {
      start: '\xFF new\x00',
      end: '\xFF new\xFF',
      valueEncoding: 'json'
    }).pipe(through(data => {
      if (recordId && data.value._id !== recordId) {
        return
      }
      funcs.push(async () => {
        let removeAttachmentIds = []
        try {
          const result = await resource.json._db.get(`\xFF old ${data.value._id}`)
          removeAttachmentIds = _.map(JSON.parse(result)._attachments, '_id')
        } catch {
        }
        removeAttachmentIds = _.difference(removeAttachmentIds, _.map(data.value._attachments, '_id'))
        await pAll(_.map(removeAttachmentIds, id => {
          return async () => {
            await resource.file.remove(id)
            logger.info(`file removed: ${id}`)
          }
        }), {concurrency: 10})
        await resource.json._db.batch([
          { type: 'del', key: data.key },
          {
            type: 'put',
            key: `\xFF old ${data.value._id}`,
            value: data.value,
            valueEncoding: 'json'
          }
        ])
      })
    }, async () => {
      await pAll(funcs, {concurrency: 1})
      await new Promise(r => setTimeout(r, 2000))
      await syncAttachment(resource, baseUrl)
      const no = await resource.json.cleanIndex()
      if (no > 0) {
        logger.info(`${name}: cleaned ${no} index`)
      }
    }))
  }
}

exports = module.exports = Replicator

