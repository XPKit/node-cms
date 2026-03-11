const JSONStream = require('JSONStream')
const through = require('through')
const pAll = require('p-all')
const _ = require('lodash')
const { setTimeout } = require('node:timers/promises')
const { EntryStream } = require('level-read-stream')

/**
 * Handles data synchronisation for a PgDOWN database instance,
 * mirroring the behaviour of SyncMongoDb.
 */
class SyncPostgres {
  /**
   * @param {import('./pgdown')} db - PgDOWN instance
   * @param {string} id - Unique server ID used for record ownership
   * @param {Object} options - Sync options (type, cms, name)
   */
  constructor(db, id, options) {
    this.db = db
    this.id = id
    this.options = options
    this.tag = `${_.get(options, 'cms.tag')} - ${options.name}`
  }

  /**
   * Streams local records owned by this server ID to the socket.
   * When isSendDataOut is false, no records are pushed (empty stream).
   * @param {net.Socket} socket
   * @param {boolean} isSendDataOut
   * @returns {Promise<void>}
   */
  async pipeLocalDataToSocket(socket, isSendDataOut) {
    await setTimeout(500)
    return new Promise((resolve, reject) => {
      let stream = null
      if (isSendDataOut) {
        stream = new EntryStream(this.db, {
          start: '\x00',
          end: '\xFF',
          valueEncoding: 'utf8',
          query: {
            _id: {
              $regex: new RegExp(`^.{8}${this.id}`)
            }
          }
        })
      } else {
        stream = new EntryStream(this.db, {
          valueEncoding: 'utf8',
          query: {
            _id: 'INVALID_ID'
          }
        })
      }
      stream
        .on('end', () => {
          resolve()
        })
        .on('error', error => {
          reject(error)
        })
        .pipe(JSONStream.stringify())
        .pipe(socket)
        .on('error', error => {
          reject(error)
        })
    })
  }

  /**
   * Receives records from the remote peer and writes them locally.
   * @param {net.Socket} socket
   * @returns {Promise<string[]>} Array of received record keys
   */
  async onReceiveDataFromSocket(socket) {
    return new Promise((resolve, reject) => {
      const remoteKeys = []
      socket
        .pipe(JSONStream.parse())
        .pipe(through(
          async data => {
            if (!_.isArray(data)) {
              data = _.compact([data])
            }
            await pAll(_.map(data, item => {
              return async () => {
                remoteKeys.push(item.key)
                await this.db.put(item.key, item.value)
              }
            }), { concurrency: 1 })
          },
          () => {
            resolve(remoteKeys)
          }
        ))
        .on('error', error => {
          reject(error)
        })
    })
  }

  /**
   * Removes records from this DB that were owned by the remote peer
   * but are no longer present on the remote side.
   * @param {string} id - Remote peer ID
   * @param {string[]} keys - Keys received from the remote peer
   * @returns {Promise<void>}
   */
  async cleanRemoteData(id, keys) {
    return new Promise((resolve, reject) => {
      const stream = new EntryStream(this.db, {
        start: '\x00',
        end: '\xFF',
        valueEncoding: 'utf8',
        query: {
          $and: [
            {
              _id: {
                $regex: new RegExp(`^.{8}${id}`)
              }
            },
            {
              _id: {
                $nin: keys
              }
            }
          ]
        }
      })
      stream
        .pipe(through(async item => {
          await this.db.del(item.key)
        }, () => {
          resolve()
        }))
        .on('error', error => {
          reject(error)
        })
    })
  }

  /**
   * Performs a full sync with a remote peer over the given socket.
   * @param {net.Socket} socket
   * @param {boolean} slave - True when this node initiated the connection
   * @param {string} remoteId - Remote peer ID
   * @returns {Promise<void>}
   */
  async sync(socket, slave, remoteId) {
    const type = this.options.type
    const isSendDataOut = (
      type === 'normal' ||
      (slave && type === 'upstream') ||
      (!slave && type === 'downstream')
    )
    let remoteKeys
    if (slave) {
      await pAll([
        async () => {
          await this.pipeLocalDataToSocket(socket, isSendDataOut)
        },
        async () => {
          remoteKeys = await this.onReceiveDataFromSocket(socket)
        }
      ], { concurrency: 1 })
      socket.destroy()
    } else {
      await pAll([
        async () => {
          remoteKeys = await this.onReceiveDataFromSocket(socket)
        },
        async () => {
          await this.pipeLocalDataToSocket(socket, isSendDataOut)
        }
      ], { concurrency: 1 })
    }
    await this.cleanRemoteData(remoteId, remoteKeys)
  }
}

exports = module.exports = SyncPostgres
