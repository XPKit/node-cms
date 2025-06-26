

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

class FileStore {
  constructor (dbpath, id, options) {
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

  read (id) {
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

  write (id) {
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

  remove (id, callback) {
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

  exists (id, callback) {
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

  list (callback) {
    // this._db.exists(id, function(error, exists){
    //   if (error) return callback({ error: error });
    //   callback(null, exists);
    // });
    fs.readdir(this._dir, (error, result) => {
      callback(error, result)
    })
  }
}

// Factory function for compatibility
function createFileStore (dbpath, id, options) {
  return new FileStore(dbpath, id, options)
}

exports = module.exports = createFileStore

/* Test helpers */

// FileStore.prototype.getIndex = function(cb) {
//   this._sync.getIndex(cb);
// }
