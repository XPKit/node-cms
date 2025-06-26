

const mkdirp = require('mkdirp')
const fs = require('fs')
const _ = require('lodash')
// Sync      = require('./sync');

/*
 * Constructor
 *
 * @param {String} namespace, e.g ['FileStores']
 * @param {Object} options
 * @return {FileStore} fileStore
 */

function FileStore (dbpath, id, options) {
  if (!(this instanceof FileStore)) {
    return new FileStore(dbpath, id, options)
  }

  mkdirp.sync(dbpath)

  this._dir = `${dbpath}/`
  this._id = id
  this._options = options
  // let db = level(dbpath);
  // this._sync = new Sync(db, id, this._options);
  // this._db = store(db);
  // this.__db = db;
}

// FileStore.prototype.sync = function(socket, slave) {
//   this._sync.sync(socket, slave);
// }

/*
 * Low level streaming APIs
 */

/*
 * Create a new readStream (from record)
 * @param {String} id
 * @return {Readable} stream
 */

FileStore.prototype.read = function (id) {
  // return this._db.createReadStream(id, {
  //   valueEncoding: encoding
  // });
  return fs.createReadStream(this._dir + id)
}

/*
 * Create a new writeStream (record)
 * @param {String} id
 * @return {Writable} stream
 */

FileStore.prototype.write = function (id) {
  // return this._db.createWriteStream(id);
  return fs.createWriteStream(this._dir + id)
}

/*
 * Highlevel Async APIs
 */

/*
 * Delete a record from database
 *
 * @param {String} id
 * @param {Function} callback(error, result)
 */

FileStore.prototype.remove = function (id, callback) {
  // this._db.delete(id, function(error){
  //   if (error) return callback({ error: error });
  //   callback(null, true);
  // });
  const filePath = this._dir + id
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (error) => {
      if (callback) {
        if (error) {
          return callback({ error })
        }
        if (_.isFunction(callback)) {
          callback(null, true)
        }
      }
    })
  } else if (_.isFunction(callback)) {
    callback(null, true)
  }
}

/*
 * Check if record exists in database
 *
 * @param {String} id
 * @param {Function} callback(error, exists)
 */

FileStore.prototype.exists = function (id, callback) {
  // this._db.exists(id, function(error, exists){
  //   if (error) return callback({ error: error });
  //   callback(null, exists);
  // });
  fs.exists(this._dir + id, (exists) => {
    if (callback) {
      callback(null, exists)
    }
  })
}

/*
 * list existing files in database
 *
 * @param {Function} callback(error, exists)
 */

FileStore.prototype.list = function (callback) {
  // this._db.exists(id, function(error, exists){
  //   if (error) return callback({ error: error });
  //   callback(null, exists);
  // });
  fs.readdir(this._dir, (error, result) => {
    callback(error, result)
  })
}

exports = module.exports = FileStore

/* Test helpers */

// FileStore.prototype.getIndex = function(cb) {
//   this._sync.getIndex(cb);
// }
