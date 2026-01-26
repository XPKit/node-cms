const mkdirp = require('mkdirp')
const fs = require('fs-extra')
const _ = require('lodash')
/*
 * Constructor
 *
 * @param {String} namespace, e.g ['FileStores']
 * @param {Object} options
 * @return {FileStore} fileStore
 */
class FileStore {
  constructor(dbpath, id, options) {
    mkdirp.sync(dbpath)
    this._dir = `${dbpath}/`
    this._id = id
    this._options = options
  }

  /*
   * Low level streaming APIs
   */

  /*
   * Create a new readStream (from record)
   * @param {String} id
   * @return {Readable} stream
   */
  read = (id) => {
    return fs.createReadStream(this._dir + id)
  }

  /*
   * Create a new writeStream (record)
   * @param {String} id
   * @return {Writable} stream
   */
  write = (id) => {
    return fs.createWriteStream(this._dir + id)
  }

  /*
   * Highlevel Async APIs
   */

  /*
   * Delete a record from database
   *
   * @param {String} id
   * @return {Boolean} exists
   */
  remove = async (id) => {
    const fileExists = this.exists(id)
    if (fileExists) {
      await fs.unlink(this._dir + id)
    }
    return fileExists
  }

  /*
   * Check if record exists in database
   *
   * @param {String} id
   */
  exists = (id) => {
    return fs.existsSync(this._dir + id)
  }

  /*
   * list existing files in database
   *
   */
  list = async () => {
    return await fs.readdir(this._dir)
  }
}

module.exports = FileStore
