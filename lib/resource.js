/*
 * Module dependencies
 */

const _ = require('lodash')
const through = require('through')
const path = require('path')
const digestStream = require('digest-stream')
const Q = require('q')
const pAll = require('p-all')
const PNG = require('pngjs').PNG
const mozjpeg = require('mozjpeg-stream')
const autoBind = require('auto-bind')

const JStore = require('./json_store')
const FStore = require('./file_store')
const Driver = require('./util/driver')
const h = require('./helpers')

/*
 * Resource configuration defaults
 */

const defaults = {
  type: 'normal',
  filterUnpublished: false
}

/*
 * Expose resource defaults to CMS
 */

/*
 * Constructor
 *
 * @param {String} name, resource name
 * @param {Object} options, resource/cms options
 *   @param {Object} cms, reference
 *     @param [Array] ns, optional, cms namespace
 *     @param {Function} uuid, UUID generator
 *   @param {Array} locales, optional
 *   @param {Boolean} filterUnpublished, optional
 */

class Resource {
  constructor (name, options, resolveMap) {
    autoBind(this)

    if (_.get(options, 'cms.dbEngine.type') === 'mongodb') {
      throw new Error('apiVersion 1 do not suppoart support mongodb, please switch to apiVersion 2')
    }

    options = this.options = _.extend({}, defaults, options)

    this.name = name
    this.resolveMap = resolveMap

    const jpath = path.join(options.cms.data, path.join(...options.cms.ns), name, 'json')
    const apath = path.join(options.cms.data, path.join(...options.cms.ns), name, 'blob')

    const key = JSON.stringify({ name })

    options.cms.gJStoreMap = options.cms.gJStoreMap || {}
    options.cms.gFStoreMap = options.cms.gFStoreMap || {}

    this.json = options.cms.gJStoreMap[key] || (options.cms.gJStoreMap[key] = new JStore(jpath, options.cms.mid, options, name))
    this.file = options.cms.gFStoreMap[key] || (options.cms.gFStoreMap[key] = new FStore(apath, options.cms.mid, options))
    this.json.attachments = this.file

    options.resource = this
    this.initDriver()
  }

  initDriver () {
    const options = this.options
    const driver = new Driver(this.name, this.options)

    driver.use((context) => {
      context.resource = context.options.resource
      return context.next()
    })

    // read
    driver.before('read', h.openReadStream)
    driver.before('read', h.filterUnpublished)
    driver.before('read', h.filterQuery)
    driver.define('read', [
      'query?',
      'options?'
    ], context => {
      context.stream = context.stream.pipe(through(function (data) {
        data._local = _.get(data, '_id', '').indexOf(options.cms.mid) === 8
        return this.queue(data)
      }))
      context.result(context.stream)
    })

    // list
    driver.before('list', h.getDependencyItems.bind(this))
    driver.define('list', [
      'query?',
      'options?'
    ], (context) => {
      context.params.options = context.params.options || {}
      // context.params.options.stringify = false;
      return context.methods.read(context.params.query, context.params.options, (error, stream) => {
        if (error) {
          console.error(error)
        }
        const results = []
        return stream.pipe(through(
          data => results.push(h.injectDependency(data, context.dependencyMap, this.options, this.resolveMap))
          , () => context.result(results)
        ))
      })
    })

    // find
    driver.before('find', h.getDependencyItems.bind(this))
    driver.define('find', [
      'query',
      'options?'
    ], (context) => {
      if (typeof context.params.query === 'string') {
        return context.resource.json.find(context.params.query, (error, result) => {
          if (error && error.notFound) {
            return context.error(h.notFoundError(context.params.query))
          }
          if (error) {
            return context.error(h.databaseError(context.params.query))
          }
          result._local = _.get(result, '_id', '').indexOf(this.options.cms.mid) === 8
          return context.result(h.injectDependency(result, context.dependencyMap, this.options, this.resolveMap))
        })
      }
      return context.methods.list(context.params.query, _.extend(context.params.options || {}, {
        page: 0,
        limit: 1
      }), (error, results) => {
        if (error) {
          return context.error(error)
        }
        if (!results.length) {
          return context.error(h.notFoundError(context.params.query))
        }
        return context.result(results[0])
      })
    })

    // exists
    driver.define('exists', ['query'], (context) => {
      if (typeof context.params.query === 'string') {
        return context.resource.json.find(context.params.query, (error) => {
          if (error && error.notFound) {
            return context.result(false)
          }
          if (error) {
            return context.error(h.databaseError(context.params.query))
          }
          return context.result(true)
        })
      }
      return context.methods.list(context.params.query, {
        page: 0,
        limit: 1
      }, (error, results) => {
        if (error) {
          return context.error(error)
        }
        if (!results.length) {
          return context.result(false)
        }
        return context.result(true)
      })
    })

    // create
    driver.before('create', h.normalizeSchema)
    driver.before('create', (context) => {
      const now = Date.now()
      _.extend(context.params.object, {
        _id: context.options.cms.uuid(),
        _createdAt: now,
        _updatedAt: now,
        _publishedAt: null,
        _attachments: []
      })
      return context.next()
    })

    driver.before('create', h.getDependencyItems.bind(this))
    driver.before('create', h.checkResourceLimits)
    driver.before('create', h.checkUniqueFields)
    driver.define('create', [
      'object',
      'options?'
    ], context => context.resource.json.create(context.params.object._id, context.params.object, (error, result) => {
      if (error) {
        return context.error(error)
      }
      result._local = _.get(result, '_id', '').indexOf(this.options.cms.mid) === 8
      return context.result(h.injectDependency(result, context.dependencyMap, this.options, this.resolveMap))
    }))
    driver.after('create', h.leaveOneActive)

    // update
    driver.before('update', h.lockResource)
    driver.before('update', h.findRecord)
    driver.before('update', h.checkUniqueFields)
    driver.define('update', [
      'id',
      'object',
      'options?'
    ], (context) => {
      delete context.params.object._id
      delete context.params.object._createdAt
      delete context.params.object._attachments
      context.params.object._updatedAt = Date.now()
      h.merge(context.record, context.params.object)
      return context.resource.json.update(context.params.id, context.record, (error, result) => {
        h.releaseResource(context)
        if (error) {
          return context.error(error)
        }
        return context.result(result)
      })
    })
    driver.after('update', h.leaveOneActive)

    // remove
    driver.before('remove', h.enableFirstAsActive)
    driver.before('remove', h.findRecord)
    driver.before('remove', async context => {
      try {
        await pAll(_.map(context.record._attachments, attachment => {
          return () => Q.ninvoke(context.resource.file, 'remove', attachment._id)
            .catch(error => { throw h.databaseError(attachment._id, error) })
        }), {concurrency: 10})
        context.next()
      } catch (error) {
        context.error(error)
      }
    })
    driver.define('remove', ['id'], context => {
      context.resource.json.remove(context.params.id, (error, result) => {
        if (error) {
          return context.error(error)
        }
        return context.result(result)
      })
    })

    // createAttachment
    driver.before('createAttachment', h.findRecord)
    driver.before('createAttachment', (context) => {
      const obj = context.params.object
      const field = _.find(context.resource.options.schema, { field: obj.name })
      if (_.get(obj, 'noOptimization', false) === false) {
        if (field && field.options && field.options.width && field.options.height) {
          if (obj.contentType === 'image/png') {
            // TODO: hugo - refactor
            obj.stream.pipe(new PNG())
              .on('parsed', function () {
                obj.stream = this.pack()
                context.next()
              })
          } else if (obj.contentType === 'image/jpeg') {
            obj.stream = obj.stream.pipe(mozjpeg())
            context.next()
          } else {
            context.next()
          }
        } else {
          context.next()
        }
      } else {
        context.next()
      }
    })
    driver.before('createAttachment', (context) => {
      const obj = context.params.object
      const attachmentId = (context.attachmentId = context.resource.options.cms.uuid())
      obj.stream.on('error', error => {
        if (error) {
          console.log(error)
        }
        // obj.stream.off('end', next);
        context.resource.file.remove(attachmentId, (error) => {
          if (error) {
            return context.error(h.databaseError(attachmentId))
          }
          return context.error('Upload error')
        })
      })
      const dstream = digestStream('md5', 'hex', md5sum => context.md5sum = md5sum)
      const writeStream = context.resource.file.write(attachmentId)
      writeStream.on('finish', () => context.next())
      context.size = 0
      return obj.stream
        .on('data', chunk => context.size += chunk.length)
        .pipe(dstream).pipe(writeStream)
    })

    driver.before('createAttachment', h.lockResource)
    driver.before('createAttachment', h.findRecord)
    driver.define('createAttachment', [
      'id',
      'object'
    ], (context) => {
      const now = Date.now()
      const obj = context.params.object
      const attachment = (context.attachment = {
        _id: context.attachmentId,
        _createdAt: now,
        _updatedAt: now,
        _name: obj.name,
        _contentType: obj.contentType,
        _md5sum: context.md5sum,
        _etag: obj.etag ? obj.etag : context.md5sum,
        _payload: obj.payload ? obj.payload : {},
        _size: context.size,
        _filename: _.get(obj, 'fields._filename', obj.filename),
        _fields: obj.fields
      })
      _.each(['cropOptions', 'order'], (key) => {
        const val = _.get(obj, key, false)
        if (val) {
          _.set(attachment, key, val)
        }
      })
      // let schema = _.find(context.resource.schema, function(item) {
      //   return item.field === attachment._name;
      // });
      context.record._attachments.push(attachment)
      context.record._updatedAt = now
      return context.resource.json.update(context.record._id, context.record, (error) => {
        h.releaseResource(context)
        if (error) {
          return context.error(error)
        }
        return context.result(attachment)
      })
    })

    // find file
    driver.define('findFile', ['aid'], (context) => {
      context.stream = context.resource.file.read(context.params.aid)
      return context.result(context.stream)
    })

    // find attachment
    driver.before('findAttachment', h.findRecord)
    driver.before('findAttachment', h.findRecordAttachment)
    driver.define('findAttachment', [
      'id',
      'aid'
    ], (context) => {
      context.attachment.stream = context.resource.file.read(context.attachment._id)
      return context.result(context.attachment)
    })

    // update attachment
    driver.before('updateAttachment', h.findRecord)
    driver.before('updateAttachment', h.findRecordAttachment)
    driver.define('updateAttachment', [
      'id',
      'aid',
      'object'
    ], (context) => {
      const now = Date.now()
      const obj = context.params.object
      // context.record._attachments.push(attachment)
      let foundAttachment = false
      context.record._attachments = _.map(context.record._attachments, (attachment) => {
        if (attachment._id === context.params.aid) {
          attachment = _.merge(attachment, obj)
          attachment._updatedAt = now
          foundAttachment = attachment
        }
        return attachment
      })
      context.record._updatedAt = now
      return context.resource.json.update(context.record._id, context.record, (error) => {
        h.releaseResource(context)
        if (error) {
          return context.error(error)
        }
        return context.result(foundAttachment)
      })
    })

    // removeAttachment
    driver.before('removeAttachment', h.findRecord)
    driver.before('removeAttachment', h.findRecordAttachment)
    driver.before('removeAttachment', context => {
      context.resource.file.remove(context.params.aid, (error) => {
        if (error && error.notFound) {
          return context.error(h.notFoundError(context.params.aid))
        }
        if (error) {
          return context.error(h.databaseError(error))
        }
        return context.next()
      })
    })

    driver.before('removeAttachment', h.lockResource)
    driver.before('removeAttachment', h.findRecord)
    driver.define('removeAttachment', [
      'id',
      'aid'
    ], (context) => {
      context.record._attachments = _.filter(context.record._attachments, attachment => attachment._id !== context.attachment._id)
      context.record._updatedAt = Date.now()
      return context.resource.json.update(context.record._id, context.record, (error) => {
        h.releaseResource(context)
        if (error) {
          return context.error(error)
        }
        return context.result(true)
      })
    })

    // cleanAttachment
    driver.define('cleanAttachment', [], context => {
      context.resource.file.list((error, aidList) => {
        if (error) {
          return context.error(error)
        }
        const stream = context.resource.json.read()
        return stream
          .on('data', (data) => {
            const attachments = data._attachments
            if (_.isArray(attachments)) {
              const list = _.map(attachments, item => item._id)
              return aidList = _.reject(aidList, item => _.includes(list, item))
            }
            return []
          })
          .on('error', attachmentError => context.error(attachmentError))
          .on('end', async () => {
            if (aidList.length > 0) {
              console.log('removing %s attachments ... ...', aidList.length)
              let count = 0

              try {
                await pAll(_.map(aidList, aid => {
                  return async () => {
                    console.log('removing %s ... ...', aid)
                    try {
                      await Q.ninvoke(context.resource.file, 'remove', aid)
                      console.log('removing %s ... ... done (%s/%s)', aid, ++count, aidList.length)
                    } catch (error) {
                      throw new Error(`remove ${aid}, ${error}`)
                    }
                  }
                }), {concurrency: 10})
              } catch (error) {
                return context.error(error)
              }
            }
            return context.result(true)
          })
      })
    })
    _.extend(this, driver.build())
  }
}

Resource.DEFAULTS = defaults

exports = module.exports = Resource
