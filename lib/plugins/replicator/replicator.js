const _ = require('lodash')
const through = require('through')
const crypto = require('crypto')
const { promisify } = require('util')
const pAll = require('p-all')
const path = require('path')
const logger = new (require(path.join(__dirname, '..', '..', 'logger')))()

const protocol = require('./protocol')

// Helper function to promisify methods
function promisifyMethod(obj, method) {
  return promisify(obj[method].bind(obj))
}

async function syncAttachment (resource, baseUrl) {
  logger.info('start syncing attachments ... ...')
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
      logger.info(`downloading file ${item.aid} ... ... `)
      await downloadAttachment(item.resource, item.baseUrl, item.name, item.aid)
      count++
      logger.info(`downloading file ${item.aid} ... ... done ( ${count} / ${downloadList.length} )`)
    }
  }), {concurrency: 10})

  await promisifyMethod(resource, 'cleanAttachment')()
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

    const fetchAndPipe = async () => {
      const response = await fetch(url)
      return new Promise((resolve, reject) => {
        const readable = require('stream').Readable.from(response.body)
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

class Replicator {
  constructor (cms) {
    /* Documents Replication */

    if (cms.options.netPort) {
      protocol.Server(cms.options.netPort, cms.options.mid, async (error, socket, name) => {
        if (error) {
          return logger.info('SERVER ERROR:', error)
        }
        let no = await promisifyMethod(cms.resource(name).json, 'cleanIndex')()
        if (no > 0) {
          logger.info(`${name}: cleaned ${no} index`)
        }
        await promisifyMethod(cms.resource(name).json, 'sync')(socket, false, null)
      })
    }

    /* Attachments Replication */

    // protocol.Server(cms.options.netPort + 1, function(error, socket, name) {
    //   if (error) return logger.info('SERVER ERROR:', error);
    //   cms.resource(name).file.sync(socket);
    // });

    /*
     * Replicate a collection on a remote server to a local collection (sync only changes)
     */

    cms.replicate = this.replicate.bind(cms)
  }

  async replicate (host, port, baseUrl, name, cb) {
    try {
      const resource = this.resource(name)
      let [socket] = await promisifyMethod(protocol, 'Client')(host, port, name, this.options.mid)

      // sync json
      await promisifyMethod(resource.json, 'sync')(socket, true, null)

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
              logger.info(`file removed: ${id}`)
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
        await new Promise(r => setTimeout(r, 2000))
        await syncAttachment(resource, baseUrl)
        let no = await promisifyMethod(resource.json, 'cleanIndex')()
        if (no > 0) {
          logger.info(`${name}: cleaned ${no} index`)
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

exports = module.exports = Replicator
