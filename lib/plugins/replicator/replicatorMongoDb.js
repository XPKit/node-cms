const _ = require('lodash')
const through = require('through')
const crypto = require('crypto')
const { promisify } = require('util')
const pAll = require('p-all')
const { Readable } = require('stream')
const path = require('path')
const logger = new (require(path.join(__dirname, '..', '..', 'logger')))()

const protocol = require('./protocol')

// Helper function to promisify methods
function promisifyMethod(obj, method) {
  return promisify(obj[method].bind(obj))
}

async function syncAttachment (resource, baseUrl) {
  console.log('start syncing attachments ... ...')
  let result = await promisifyMethod(resource, 'list')()

  // const attachmentList = _.reduce(result, (memo, item) => _.union(memo, item._attachments), [])
  const attachmentList = _.compact(_.flatten(_.map(result, '_attachments')))
  const downloadList = []

  await pAll(_.map(attachmentList, attachment => {
    return async () => {
      let exists = await promisifyMethod(resource.file, 'exists')(attachment._id)

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
      console.log(`downloading file ${item.aid} ... ... `)
      await downloadAttachment(item.resource, item.baseUrl, item.name, item.aid)
      count++
      console.log(`downloading file ${item.aid} ... ... done ( ${count} / ${downloadList.length} )`)
    }
  }), {concurrency: 10})

  await promisifyMethod(resource, 'cleanAttachment')()
  console.log('start syncing attachments ... ... done')
}

async function downloadAttachment (resource, baseUrl, name, aid) {
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

    const fetchAndPipe = async () => {
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
          }).on('error', (error) => {
            resource.file.remove(aid)
            reject(new Error(`downloading file ${aid} ... ... error, ${error}`))
          })
      })
    }

    return await fetchAndPipe()
  } catch (error) {
    resource.file.remove(aid)
    throw new Error(`downloading file ${aid} ... ... error, ${error}`)
  }
}

class ReplicatorMongoDb {
  constructor (cms) {
    /* Documents Replication */

    if (cms.options.netPort) {
      protocol.Server(cms.options.netPort, cms.options.mid, async (error, socket, name, remoteId) => {
        if (error) {
          return console.log('SERVER ERROR:', error)
        }
        // send data to slave
        await promisifyMethod(cms.resource(name).json, 'sync')(socket, false, remoteId)
      })
    }
    cms.replicate = this.replicate.bind(cms)
  }

  async replicate (host, port, baseUrl, name, cb) {
    try {
      const resource = this.resource(name)
      let [socket, remoteId] = await promisifyMethod(protocol, 'Client')(host, port, name, this.options.mid)

      // send data to master
      await promisifyMethod(resource.json, 'sync')(socket, true, remoteId)

      // sync attachment
      let funcs = []
      return resource.json._db.createReadStream({
        start: '\xFF new\x00',
        end: '\xFF new\xFF',
        valueEncoding: 'json'
      }).pipe(through(data => {
        funcs.push(async () => {
          let removeAttachmentIds = []
          try {
            let result = await promisifyMethod(resource.json._db, 'get')(`\xFF old ${data.value._id}`)
            removeAttachmentIds = _.map(JSON.parse(result)._attachments, '_id')
          } catch (error) {
          }

          removeAttachmentIds = _.difference(removeAttachmentIds, _.map(data.value._attachments, '_id'))

          await pAll(_.map(removeAttachmentIds, id => {
            return async () => {
              await promisifyMethod(resource.file, 'remove')(id)
              console.log(`file removed: ${id}`)
            }
          }), {concurrency: 10})

          await promisifyMethod(resource.json._db, 'batch')([
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
        await new Promise(resolve => setTimeout(resolve, 2000))
        await syncAttachment(resource, baseUrl)
        let no = await promisifyMethod(resource.json, 'cleanIndex')()
        if (no > 0) {
          console.log(`${name}: cleaned ${no} index`)
        }
        if (_.isFunction(cb)) {
          cb()
        }
      }))
    } catch (error) {
      cb(error)
    }
  }
}

exports = module.exports = ReplicatorMongoDb
