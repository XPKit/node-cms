const _ = require('lodash')
const through = require('through')
const crypto = require('node:crypto')
const pAll = require('p-all')
const { Readable } = require('node:stream')
const logger = new (require('img-sh-logger'))()

const protocol = require('./protocol')

async function syncAttachment(resource, baseUrl) {
  console.log('start syncing attachments ... ...')
  const result = await resource.list()
  const attachmentList = _.compact(_.flatten(_.map(result, '_attachments')))
  const downloadList = []
  await pAll(
    _.map(attachmentList, (attachment) => {
      return async () => {
        const exists = await resource.file.exists(attachment._id)
        if (!exists) {
          downloadList.push({
            baseUrl,
            resource,
            name: resource.name,
            aid: attachment._id,
          })
        } else {
          const stream = resource.file.read(attachment._id)
          const digester = crypto.createHash('md5')
          const digest = through(
            (data) => {
              digester.update(data, 'hex')
            },
            () => {
              const md5sum = digester.digest('hex')
              if (md5sum !== attachment._md5sum) {
                downloadList.push({
                  baseUrl,
                  resource,
                  name: resource.name,
                  aid: attachment._id,
                })
              }
            },
          )
          stream.pipe(digest)
        }
      }
    }),
    { concurrency: 10 },
  )
  let count = 0
  await pAll(
    _.map(downloadList, (item) => {
      return async () => {
        console.log(`downloading file ${item.aid} ... ... `)
        await downloadAttachment(item.resource, item.baseUrl, item.name, item.aid)
        count++
        console.log(`downloading file ${item.aid} ... ... done ( ${count} / ${downloadList.length} )`)
      }
    }),
    { concurrency: 10 },
  )
  await resource.cleanAttachments()
  console.log('start syncing attachments ... ... done')
}

async function downloadAttachment(resource, baseUrl, name, aid) {
  const url = `${baseUrl + name}/file/${aid}`
  try {
    try {
      const headResponse = await fetch(url, { method: 'HEAD' })
      if (!headResponse.ok) {
        throw new Error(`HTTP ${headResponse.status}`)
      }
    } catch (error) {
      logger.warn(`downloading file ${aid} ... ... miss`, error)
      return
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return new Promise((resolve, reject) => {
      const readable = Readable.fromWeb(response.body)
      readable
        .pipe(resource.file.write(aid))
        .on('finish', () => {
          resolve()
        })
        .on('error', (error) => {
          resource.file.remove(aid)
          reject(new Error(`downloading file ${aid} ... ... error, ${error}`))
        })
    })
  } catch (error) {
    resource.file.remove(aid)
    throw new Error(`downloading file ${aid} ... ... error, ${error}`)
  }
}

class ReplicatorMongoDb {
  constructor(cms) {
    this.cms = cms
    /* Documents Replication */
    if (cms.options.netPort) {
      protocol.Server(cms.options.netPort, cms.options.mid, async (error, socket, name, remoteId) => {
        if (error) {
          return console.log('SERVER ERROR:', error)
        }
        // send data to slave
        await this.cms.resource(name).json.sync(socket, false, remoteId)
      })
    }
  }

  resource = (name) => {
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
  async replicate(host, port, baseUrl, name, recordId) {
    const resource = this.resource(name)

    // Convert protocol.Client callback to Promise
    const [socket, remoteId] = await new Promise((resolve, reject) => {
      protocol.Client(host, port, name, this.options.mid, (error, socket, id) => {
        if (error) {
          reject(error)
        } else {
          resolve([socket, id])
        }
      })
    })

    // send data to master (optionally filter by recordId)
    if (recordId) {
      await resource.json.sync(socket, true, remoteId, recordId)
    } else {
      await resource.json.sync(socket, true, remoteId)
    }
    // sync attachment (optionally filter by recordId)
    const funcs = []
    const { EntryStream } = require('level-read-stream')
    return new EntryStream(resource.json._db, {
      start: '\xFF new\x00',
      end: '\xFF new\xFF',
      valueEncoding: 'json',
    }).pipe(
      through(
        (data) => {
          if (recordId && data.value._id !== recordId) {
            return
          }
          funcs.push(async () => {
            let removeAttachmentIds = []
            try {
              const result = await resource.json._db.get(`\xFF old ${data.value._id}`)
              removeAttachmentIds = _.map(JSON.parse(result)._attachments, '_id')
            } catch {
              // ignore error
            }
            removeAttachmentIds = _.difference(removeAttachmentIds, _.map(data.value._attachments, '_id'))
            await pAll(
              _.map(removeAttachmentIds, (id) => {
                return async () => {
                  await resource.file.remove(id)
                  console.log(`file removed: ${id}`)
                }
              }),
              { concurrency: 10 },
            )
            await resource.json._db.batch([
              { type: 'del', key: data.key },
              {
                type: 'put',
                key: `\xFF old ${data.value._id}`,
                value: data.value,
                valueEncoding: 'json',
              },
            ])
          })
        },
        async () => {
          await pAll(funcs, { concurrency: 1 })
          await new Promise((resolve) => setTimeout(resolve, 2000))
          await syncAttachment(resource, baseUrl)
          const no = await resource.json.cleanIndex()
          if (no > 0) {
            console.log(`${name}: cleaned ${no} index`)
          }
        },
      ),
    )
  }
}

module.exports = ReplicatorMongoDb
