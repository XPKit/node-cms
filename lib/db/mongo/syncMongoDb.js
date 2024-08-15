

const Q = require('q')
const JSONStream = require('JSONStream')
const through = require('through')
const pAll = require('p-all')
const _ = require('lodash')
const {setTimeout} = require('node:timers/promises')
/*
 * Const
 */

/*
 * Constructor
 *
 * @param {Object} database, instnace of leveldb
 * @param {String} id, unique database instance id, used for replication
 * @param {Object} options
 *   @param {String} type, replication type (normal, upstream, downstream)
 *
 */

class SyncMongoDb {
  constructor (db, id, options) {
    this.db = db
    this.id = id
    this.options = options
    this.tag = `${_.get(options, 'cms.tag')} - ${options.name}`
  }

  async pipeLocalDataToSocket (socket, isSendDataOut, slave) {
    await setTimeout(500) // wait the receive socket is ready

    let deferred = Q.defer()
    let stream = null

    if (isSendDataOut) {
      stream = this.db.createReadStream({
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
      stream = this.db.createReadStream({
        valueEncoding: 'utf8',
        query: {
          _id: 'INVALID_ID'
        }
      })
    }

    // send data to slave
    stream
      // .on('data', data => {
      //   console.log(111, this.tag, 'send', data.key)
      // })
      .on('end', () => {
        deferred.resolve()
      })
      .on('error', error => {
        deferred.reject(error)
      })
      .pipe(JSONStream.stringify())
      .pipe(socket)
      .on('error', error => {
        deferred.reject(error)
      })

    await deferred.promise

    // console.log(333, this.tag, 'send done')
  }

  async onReceiveDataFromSocket (socket) {
    // receive data from slave
    let deferred = Q.defer()
    let remoteKeys = []
    socket
      // .on('data', data => {
      //   console.log(222, this.tag, 'receive', _.toString(data))
      // })
      .pipe(JSONStream.parse())
      .pipe(through(
        async data => {
          if (!_.isArray(data)) {
            data = _.compact([data])
          }
          await pAll(_.map(data, item => {
            return async () => {
              remoteKeys.push(item.key)
              await Q.ninvoke(this.db, 'put', item.key, item.value)
            }
          }), {concurrency: 1})
        },
        () => {
          deferred.resolve()
        }
      ))
      .on('error', error => {
        deferred.reject(error)
      })
    // console.log(444, 'onReceiveDataFromSocket', this.tag)
    await deferred.promise
    return remoteKeys
  }

  async cleanRemoteData (id, keys) {
    let deferred = Q.defer()
    // await Q.ninvoke(this.db, 'del', item.key)
    let stream = this.db.createReadStream({
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
        await Q.ninvoke(this.db, 'del', item.key)
      }, () => {
        deferred.resolve()
      }))
      .on('error', error => {
        deferred.reject(error)
      })
    return deferred.promise
  }

  async sync (socket, slave, remoteId) {
    const type = this.options.type
    let isSendDataOut = type === 'normal' || (slave && type === 'upstream') || (!slave && type === 'downstream')
    let remoteKeys

    if (slave) {
      await pAll([
        async () => {
          await this.pipeLocalDataToSocket(socket, isSendDataOut, slave)
        },
        async () => {
          remoteKeys = await this.onReceiveDataFromSocket(socket, slave)
        }
      ], {concurrency: 1})
      socket.destroy()
    } else {
      await pAll([
        async () => {
          remoteKeys = await this.onReceiveDataFromSocket(socket, slave)
        },
        async () => {
          await this.pipeLocalDataToSocket(socket, isSendDataOut, slave)
        }
      ], {concurrency: 1})
    }
    await this.cleanRemoteData(remoteId, remoteKeys)
  }
}

exports = module.exports = SyncMongoDb
