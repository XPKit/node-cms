const timestamp = require('../../util/timestamp')
const through = require('through')
const _ = require('lodash')
const mps = require('msgpack-stream')
const { EntryStream } = require('level-read-stream')

/*
 * Const
 */

const replicaPrefix = '\xFDreplica\xFD'
const indexPrefix = '\xFF index'
const clockPrefix = '\xFF clock'

const clockRange = {
  start: `${clockPrefix} `,
  end: `${clockPrefix}\xFF`,
}

class Sync {
  constructor(db, id, options) {
    this.db = db
    this.id = id
    this.options = options
    this.clock = {}
    this.wrap()
  }

  startsWith(str, prefix) {
    return str?.startsWith(prefix)
  }

  indexKey(namespace, ts) {
    return `${indexPrefix} ${namespace} ${ts}`
  }

  clockKey(namespace) {
    return `${clockPrefix} ${namespace}`
  }

  wrap() {
    if (!this.db.hooks || !this.db.hooks.prewrite || typeof this.db.hooks.prewrite.add !== 'function') {
      throw new Error(`Database instance does not support hooks.prewrite. Class: ${this.db.constructor.name}`)
    }
    const clock = this.clock
    const db = this.db
    const id = this.id
    db.hooks.prewrite.add((change, batch) => {
      let ts, namespace
      if (this.startsWith(change.key, replicaPrefix)) {
        const parts = change.key.split(' ')
        parts.shift()
        namespace = parts.shift()
        ts = parts.shift()
        change.key = parts.join(' ')
        batch.add({ type: 'put', key: ` new ${change.key}`, value: change.value })
      } else {
        ts = timestamp()
        namespace = id
      }
      batch.add({ type: 'put', key: this.indexKey(namespace, ts), value: change.key })
      const k = this.clockKey(namespace)
      const local = clock[k] || '0'
      if (local > ts) {
        ts = local
      } else {
        clock[k] = ts
      }
      batch.add({ type: 'put', key: k, value: ts.toString() })
    })
    db.hooks.prewrite.add((op, _batch) => {
      clock[op.key] = op.value
    })
    new EntryStream(db, clockRange).pipe(
      through(
        function (data) {
          if (!clock[data.key] || clock[data.key] < data.key) {
            clock[data.key] = data.value
          } else {
            throw new Error('old value or is not yet loaded')
          }
          this.emit('data', data)
        },
        function () {
          this.emit('end')
        },
      ),
    )
  }

  sync(socket, slave) {
    return new Promise((resolve, reject) => {
      const db = this.db
      const clock = this.clock
      const type = this.options.type
      const pullChanges = type === 'normal' || (type === 'downstream' && slave) || (type === 'upstream' && !slave)
      const pushChanges = type === 'normal' || (type === 'downstream' && !slave) || (type === 'upstream' && slave)
      let pushClosed = !pushChanges
      let pullClosed = !pullChanges
      const encode = mps.createEncodeStream()
      const decode = mps.createDecodeStream()
      const duplex = through((data) => {
        duplex.pause()
        if (data.op === 'put') {
          if (!pullChanges) {
            duplex.resume()
            if (pushClosed) {
              duplex.emit('end')
            }
            return
          }
          db.put(data.key, data.value, { valueEncoding: 'utf8' }, (error) => {
            if (error) {
              console.error(error)
            }
            duplex.resume()
            duplex.emit('data', { op: 'clock', value: clock })
          })
        } else if (data.op === 'del') {
          if (!pullChanges) {
            duplex.resume()
            if (pushClosed) {
              duplex.emit('end')
            }
            return
          }
          db.del(data.key, (error) => {
            if (error) {
              console.error(error)
            }
            duplex.resume()
            duplex.emit('data', { op: 'clock', value: clock })
          })
        } else if (data.op === 'end') {
          // do nothing
        } else if (data.op === 'clock') {
          if (!pushChanges) {
            duplex.resume()
            if (pullClosed) {
              duplex.emit('end')
            }
            return
          }
          let target
          const clientClock = data.value
          _.find(clock, (time, name) => {
            if (!clientClock[name]) {
              target = { name: name.split(' ')[2], time: '' }
              return true
            } else if (clientClock[name] < time) {
              target = { name: name.split(' ')[2], time: clientClock[name] }
              return true
            }
            return false
          })
          if (pullChanges) {
            pullClosed = true
            _.find(clientClock, (time, name) => {
              if (!clock[name] || clock[name] < time) {
                pullClosed = false
                return true
              }
              return false
            })
          }
          if (!target) {
            duplex.resume()
            pushClosed = true
            if (pullClosed) {
              duplex.emit('end')
            }
            return
          }
          const key = `${this.indexKey(target.name, target.time)}  `
          const stream = new EntryStream(db, {
            start: key,
            end: this.indexKey(target.name, '\u001f'),
            limit: 1,
            keyEncoding: 'utf8',
            valueEncoding: 'utf8',
          })
          stream.on('data', (index) => {
            db.get(
              index.value,
              {
                fillCache: false,
                keyEncoding: 'utf8',
                valueEncoding: 'utf8',
              },
              (error, record) => {
                duplex.resume()
                if (error?.notFound) {
                  duplex.emit('data', {
                    key: [replicaPrefix, target.name, index.key.split(' ')[3], index.value].join(' '),
                    op: 'del',
                  })
                } else if (!error) {
                  duplex.emit('data', {
                    key: [replicaPrefix, target.name, index.key.split(' ')[3], index.value].join(' '),
                    op: 'put',
                    value: record,
                  })
                } else {
                  console.log('ERROR: trying to pull index key from database', error)
                }
              },
            )
          })
        }
      })

      socket
        .pipe(decode)
        .pipe(duplex)
        .pipe(encode)
        .pipe(socket)
        .on('end', () => {
          resolve(null)
        })
        .on('error', (error) => {
          reject(error)
        })

      if (pullChanges) {
        encode.write({ op: 'clock', value: clock })
      }
    })
  }

  getIndex(cb) {
    const out = []
    new EntryStream(this.db, {
      start: `${indexPrefix}\u0000`,
      end: `${indexPrefix}\u001f`,
    }).pipe(
      through(
        (data) => {
          out.push(data)
        },
        () => {
          cb(out)
        },
      ),
    )
  }
}

module.exports = Sync
