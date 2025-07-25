

const hooks = require('level-hooks')
const timestamp = require('../../util/timestamp')
const through = require('through')
const _ = require('lodash')
const mps = require('msgpack-stream')
const Q = require('q')

/*
 * Const
 */

const start = '\x00'
const end = '\xFE'
const replicaPrefix = '\xFDreplica\xFD'
const indexPrefix = '\xFF index'
const clockPrefix = '\xFF clock'
const clockRange = {
  start: `${clockPrefix} `,
  end: `${clockPrefix}\xFF`
}

/*
 * Helpers
 */

const startsWith = function (str, prefix) {
  return str.indexOf(prefix) === 0
}

const indexKey = function (ns, ts) {
  return [indexPrefix,
    ns,
    ts].join(' ')
}

const clockKey = function (ns) {
  return [clockPrefix,
    ns].join(' ')
}

/*
 * Constructor
 *
 * @param {Object} database, instnace of leveldb
 * @param {String} id, unique database instance id, used for replication
 * @param {Object} options
 *   @param {String} type, replication type (normal, upstream, downstream)
 *
 */

function Sync (db, id, options) {
  this.db = db
  this.id = id
  this.options = options
  this.clock = {}
  this.wrap()
}

Sync.prototype.wrap = function () {
  const clock = this.clock
  const db = this.db
  const id = this.id

  hooks(db)
  db.hooks.pre({ start, end }, (change, add) => {
    let ts, namespace
    if (startsWith(change.key, replicaPrefix)) {
      const parts = change.key.split(' ')
      parts.shift()
      namespace = parts.shift()
      ts = parts.shift()
      change.key = parts.join(' ')
      add({ type: 'put', key: `\xFF new ${change.key}`, value: change.value })
    } else {
      ts = timestamp()
      namespace = id
    }
    add({ type: 'put', key: indexKey(namespace, ts), value: change.key })
    const k = clockKey(namespace)
    const local = clock[k] || '0'
    if (local > ts) {
      ts = local
    } else {
      clock[k] = ts
    }
    add({ type: 'put', key: k, value: ts.toString() })
  })
  db.hooks.pre(clockRange, (change) => {
    clock[change.key] = change.value
  })
  db.createReadStream(clockRange).pipe(through(function (data) {
    if (!clock[data.key] || clock[data.key] < data.key) {
      clock[data.key] = data.value
    } else {
      throw new Error('old value or is not yet loaded')
    }
    this.emit('data', data)
  }, function () {
    this.emit('end')
  }))
}

Sync.prototype.sync = function (socket, slave) {
  let deferred = Q.defer()
  const db = this.db
  const clock = this.clock
  const type = this.options.type
  const pullChanges = (type === 'normal') || (type === 'downstream' && slave) || (type === 'upstream' && !slave)
  const pushChanges = (type === 'normal') || (type === 'downstream' && !slave) || (type === 'upstream' && slave)
  let pushClosed = !pushChanges
  let pullClosed = !pullChanges
  const encode = mps.createEncodeStream()
  const decode = mps.createDecodeStream()
  const duplex = through((data) => {
    duplex.pause()
    if (data.op === 'put') {
      if (!pullChanges) {
        duplex.resume()
        if (pushClosed) { duplex.emit('end') }
        return
      }
      db.put(data.key, data.value, { valueEncoding: 'utf8' }, (error) => {
        if (error) { console.error(error) }
        duplex.resume()
        duplex.emit('data', { op: 'clock', value: clock })
      })
    } else if (data.op === 'del') {
      if (!pullChanges) {
        duplex.resume()
        if (pushClosed) { duplex.emit('end') }
        return
      }
      db.del(data.key, (error) => {
        if (error) { console.error(error) }
        duplex.resume()
        duplex.emit('data', { op: 'clock', value: clock })
      })
    } else if (data.op === 'end') {
      // do nothing
    } else if (data.op === 'clock') {
      if (!pushChanges) {
        duplex.resume()
        if (pullClosed) { duplex.emit('end') }
        return
      }
      let target
      let clientClock = data.value
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
        if (pullClosed) { duplex.emit('end') }
        return
      }
      const key = `${indexKey(target.name, target.time)} \x00`
      const stream = db.createReadStream({
        start: key,
        end: indexKey(target.name, '\xFF'),
        limit: 1,
        keyEncoding: 'utf8',
        valueEncoding: 'utf8'
      })
      stream.on('data', (index) => {
        db.get(index.value, {
          fillCache: false,
          keyEncoding: 'utf8',
          valueEncoding: 'utf8'
        }, (error, record) => {
          duplex.resume()
          if (error && error.notFound) {
            duplex.emit('data', {
              key: [replicaPrefix, target.name, index.key.split(' ')[3], index.value].join(' '),
              op: 'del'
            })
          } else if (!error) {
            duplex.emit('data', {
              key: [replicaPrefix, target.name, index.key.split(' ')[3], index.value].join(' '),
              op: 'put',
              value: record
            })
          } else {
            console.log('ERROR: trying to pull index key from database', error)
          }
        })
      })
    }
  })

  socket
    .pipe(decode)
    .pipe(duplex)
    .pipe(encode)
    .pipe(socket)
    .on('end', () => {
      deferred.resolve(null)
    })
    .on('error', error => {
      deferred.reject(error)
    })

  if (pullChanges) {
    encode.write({ op: 'clock', value: clock })
  }

  return deferred.promise
}

Sync.prototype.getIndex = function (cb) {
  const out = []
  this.db.createReadStream({
    start: `${indexPrefix}\x00`,
    end: `${indexPrefix}\xFF`
  }).pipe(through((data) => {
    out.push(data)
  }, () => {
    cb(out)
  }))
}



exports = module.exports = Sync
