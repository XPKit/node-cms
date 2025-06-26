

const _ = require('lodash')
const mime = require('mime-types')
const through = require('through')
const path = require('path')
const digestStream = require('digest-stream')
const pAll = require('p-all')
const autoBind = require('auto-bind')
const toArray = require('stream-to-array')
const MimeStream = require('mime-stream')

const JStore = require('./db/json_store')
const FStore = require('./db/file_store')
const Driver = require('./util/driver')
const ImageMin = require('./util/imagemin')
const h = require('./helpers')

const logger = new (require('img-sh-logger'))()

/*
 * Resource configuration defaults
 */

const defaults = {
  type: 'normal'
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
 */

class RequiredFieldError extends Error {
}

class Resource {
  constructor (name, options, resolveMap, cms) {
    autoBind(this)
    this.cms = cms
    this.api = this.cms.api()
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
    this.defaultResize = 'autox100'
  }

  clean (object) {
    Object
      .entries(object)
      .forEach(([k, v]) => {
        if (v && typeof v === 'object') {
          this.clean(v)
        }
        if (v && typeof v === 'object' && !Object.keys(v).length || v === null || v === undefined) {
          if (Array.isArray(object)) {
            object.splice(k, 1)
          } else {
            if (Array.isArray(v) && v.length === 0) {
              logger.log(`Will not clean ${k}`)
            } else {
              delete object[k]
            }
          }
        }
      })
    return object
  }

  isEqual (updateItem, cmsItem) {
    if (_.isPlainObject(updateItem) || _.isArray(updateItem)) {
      if (_.isArray(updateItem) && _.size(updateItem) !== _.size(cmsItem)) {
        return false
      }
      return _.every(_.keys(updateItem), key => cmsItem && this.isEqual(updateItem[key], cmsItem[key]))
    }
    return _.isEqual(updateItem, cmsItem)
  }

  async getBufferFromStream (attachmentStream) {
    const parts = await toArray(attachmentStream)
    const buffers = parts.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part))
    return Buffer.concat(buffers)
  }

  findRecordWithUniqueKey(errors, records, uniqueKey, value) {
    const v = _.find(records, {[uniqueKey]: value})
    if (!v && errors != null) {
      errors.push('record (' + value + ') not found in resource ' + name)
    }
    return v != null ? v._id : void 0
  }

  convertKeyToId (value, type, records, name, uniqueKeys, errors) {
    const uniqueKey = _.first(uniqueKeys)
    if (type === 'select') {
      return this.findRecordWithUniqueKey(errors, records, uniqueKey, value)
    } else if (type === 'multiselect') {
      return _.compact(_.map(value, (key)=> this.findRecordWithUniqueKey(errors, records, uniqueKey, key)))
    }
    return value
  }

  getUniqueKeys () {
    const uniqueKeyField = _.filter(this.options.schema, item => item.unique || item.xlsxKey)
    if (_.isEmpty(uniqueKeyField)) {
      throw new Error(`${this.name} didn't have unique key field`)
    }
    return _.map(uniqueKeyField, 'field')
  }

  setJSONKey (item, key) {
    const v = _.get(item, key)
    _.set(item, key, v ? JSON.parse(v) : v)
  }

  async getImportMap (importList, query, isCheckRequired) {
    let errors = []
    let cmsList = await this.list()
    const uniqueKeys = this.getUniqueKeys()
    const schema = this.options.schema
    await pAll(_.map(schema, field => {
      return async () => {
        if (field.input === 'object') {
          _.each(importList, item => {
            if (field.locales) {
              _.each(field.locales, locale => {
                this.setJSONKey(item, `${field.field}.${locale}`)
              })
            } else {
              this.setJSONKey(item, field.field)
            }
          })
        }
        if (!_.isString(field.source)) {
          return
        }
        try {
          const relationUniqueKeys = this.api(field.source).getUniqueKeys()
          const dependencyRecords = await this.api(field.source).list()
          _.each(importList, item => {
            const keyObj = _.pick(item, uniqueKeys)
            if (field.locales) {
              _.each(field.locales, locale => {
                let v = _.get(item, `${field.field}.${locale}`)
                let oldKey = v
                if (_.isEmpty(v)) {
                  return _.set(item, `${field.field}.${locale}`, null)
                }
                v = this.convertKeyToId(v, field.input, dependencyRecords, field.source, relationUniqueKeys, errors)
                if (isCheckRequired && field.required && (_.isUndefined(v) || (!_.isArray(v) && _.isEmpty(v)))) {
                  throw new RequiredFieldError(`record (${JSON.stringify(keyObj)}), required field (${field.field}) and value (${oldKey}) is invalid`)
                }
                _.set(item, `${field.field}.${locale}`, v)
              })
            } else {
              let v = _.get(item, field.field)
              let oldKey = v
              if (_.isEmpty(v)) {
                return _.set(item, field.field, null)
              }
              v = this.convertKeyToId(v, field.input, dependencyRecords, field.source, relationUniqueKeys, errors)
              if (isCheckRequired && field.required && (_.isUndefined(v) || (!_.isArray(v) && _.isEmpty(v)))) {
                throw new RequiredFieldError(`record (${JSON.stringify(keyObj)}), required field (${field.field}) and value (${oldKey}) is invalid`)
              }
              _.set(item, field.field, v)
            }
          })

          // update query
          let v = _.get(query, field.field)
          if (query && v) {
            v = this.convertKeyToId(v, field.input, dependencyRecords, field.source, relationUniqueKeys, errors)
            _.set(query, field.field, v)
          }
        } catch (error) {
          if (error instanceof RequiredFieldError) {
            throw error
          }
          logger.warn(error.message)
        }
      }
    }))
    if (!_.isEmpty(errors)) {
      logger.error(errors)
    }
    const removeItem = _.filter(cmsList, item => !_.find(importList, _.pick(item, uniqueKeys)))
    const createItem = _.filter(importList, item => !_.find(cmsList, _.pick(item, uniqueKeys)))
    let updateItem = _.difference(importList, createItem)
    if (query) {
      const filteredCmsList = _.filter(cmsList, query)
      updateItem = _.filter(updateItem, item => _.find(filteredCmsList, _.pick(item, uniqueKeys)))
    }
    updateItem = _.filter(updateItem, updateItem => {
      const cmsItem = _.find(cmsList, _.pick(updateItem, uniqueKeys))
      updateItem._id = cmsItem._id
      return !this.isEqual(updateItem, cmsItem)
    })
    return {create: createItem, update: updateItem, remove: removeItem}
  }

  getParagraphSchema(type) {
    return _.get(this.cms._paragraphs, `${type}.schema`, [])
  }

  // cleanDataBasedOnSchema(schema, data) {
  //   const formattedData = {}
  //   _.each(schema, (field)=> {
  //     const foundVal = _.get(data, field.field)
  //     if (!_.isUndefined(foundVal)) {
  //       if (field.input === 'paragraph') {
  //         _.each(foundVal, (paragraphItem, i)=> {
  //           const type = _.get(paragraphItem, '_type', false)
  //           if (!type) {
  //             return logger.error('Type of paragraph item not specified, will remove it', paragraphItem)
  //           }
  //           _.set(formattedData, `${field.field}[${i}]`, this.cleanDataBasedOnSchema(this.getParagraphSchema(type), paragraphItem))
  //         })
  //       } else {
  //         _.set(formattedData, field.field, foundVal)
  //       }
  //     }
  //   })
  //   _.each(data, (field, key)=> {
  //     if (_.includes(['_updatedBy', '_type', '_id', '_updatedBy'], key)) {
  //       _.set(formattedData, key, field)
  //     }
  //   })
  //   return formattedData
  // }

  // cleanData(context) {
  //   context.params.object = this.cleanDataBasedOnSchema(context.resource.options.schema, _.cloneDeep(context.params.object))
  //   context.next()
  // }

  broadcast(action, context) {
    const resource = _.get(context, 'options.name', false)
    if (_.startsWith(resource, '_')) {
      return
    }
    this.cms.broadcast({
      action,
      data: {
        resource,
        _id: _.get(context, '_result._id', false),
        _updatedBy: _.get(context, '_result._updatedBy', false)
      }
    })
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
    driver.before('read', h.filterQuery)
    driver.define('read', ['query?', 'options?'], async context => {
      return new Promise((resolve) => {
        context.stream = context.stream.pipe(through(function (data) {
          data._local = _.get(data, '_id', '').indexOf(options.cms.mid) === 8
          return this.queue(data)
        }))
        context.result(context.stream)
        resolve(context.stream)
      })
    })
    // list
    driver.before('list', h.getDependencyItems.bind(this))
    driver.define('list', ['query?', 'options?'], async (context) => {
      context.params.options = context.params.options || {}
      return context.methods.read(context.params.query, context.params.options, (error, gotStream) => {
        if (error) {
          console.error(error)
        }
        const results = []
        return gotStream.pipe(through(
          data => {
            return results.push(h.injectDependency(data, context.dependencyMap, this.options, this.resolveMap))
          }, () => {
            return context.result(results)
          }
        ))
      })
    })
    // find
    driver.before('find', h.getDependencyItems.bind(this))
    driver.define('find', ['query', 'options?'], async (context) => {
      if (typeof context.params.query === 'string') {
        try {
          const result = await context.resource.json.find(context.params.query)
          result._local = _.get(result, '_id', '').indexOf(options.cms.mid) === 8
          return context.result(h.injectDependency(result, context.dependencyMap, this.options, this.resolveMap))
        } catch (error) {
          if (error.notFound) {
            return context.error(h.recordNotFoundErrorV2(context.resource.name, context.params.query, error))
          }
          return context.error(h.recordNotFoundErrorV2(context.resource.name, context.params.query, error))
        }
      }
      // logger.warn(`resourceV2 - find =====`, context.params)
      try {
        const results = await context.methods.list(context.params.query, _.extend(context.params.options || {}, {page: 0,limit: 1}))
        if (!results.length) {
          return context.error(h.listNotFoundErrorV2(context.resource.name, context.params.query))
        }
        return context.result(results[0])
      } catch (error) {
        return context.error(h.listRecordErrorV2(context.resource.name, context.params.query, error))
      }
    })
    // exists
    driver.define('exists', ['query'], async (context) => {
      if (typeof context.params.query === 'string') {
        try {
          await context.resource.json.find(context.params.query)
          return context.result(true)
        } catch (error) {
          if (error.notFound) {
            return context.result(false)
          }
          return context.error(h.recordNotFoundErrorV2(context.resource.name, context.params.query))
        }
      }
      try {
        const results = await context.methods.list(context.params.query, { page: 0, limit: 1 })
        if (!results.length) {
          return context.result(false)
        }
        return context.result(true)
      } catch (error) {
        return context.error(h.recordNotFoundErrorV2(context.resource.name, context.params.query, error))
      }
    })
    // create
    driver.before('create', h.normalizeSchema)
    // driver.before('create', this.cleanData)
    driver.before('create', (context) => {
      const now = Date.now()
      _.extend(context.params.object, {
        _id: context.options.cms.uuid(),
        _createdAt: now,
        _updatedAt: now,
        _publishedAt: null
      })
      // context.params.object = this.clean(context.params.object)
      return context.next()
    })
    driver.before('create', h.getDependencyItems.bind(this))
    driver.before('create', h.checkResourceLimits)
    driver.before('create', h.checkUniqueFields)
    driver.define('create', ['object', 'options?'], async (context)=> {
      try {
        const result = await context.resource.json.create(context.params.object._id, context.params.object)
        result._local = _.get(result, '_id', '').indexOf(options.cms.mid) === 8
        return context.result(h.injectDependency(result, context.dependencyMap, this.options, this.resolveMap))
      } catch (error) {
        return context.error(error)
      }
    })
    driver.after('create', h.leaveOneActive)
    driver.after('create', async (context)=> {
      this.broadcast('create', context)
      context.next()
    })
    // update
    driver.before('update', h.lockResource)
    driver.before('update', h.findRecord)
    driver.before('update', h.checkUniqueFields)
    // driver.before('update', this.cleanData)
    driver.define('update', ['id', 'object', 'options?'], async (context) => {
      delete context.params.object._id
      delete context.params.object._createdAt
      delete context.params.object._attachments
      context.params.object._updatedAt = Date.now()
      // context.params.object = this.clean(context.params.object)
      h.merge(context.record, context.params.object)
      try {
        const result = await context.resource.json.update(context.params.id, context.record)
        h.releaseResource(context)
        return context.result(result)
      } catch (error) {
        return context.error(h.updateRecordErrorV2(context.resource.name, context.params.id, error))
      }
    })
    driver.after('update', h.leaveOneActive)
    driver.after('update', async (context)=> {
      this.broadcast('update', context)
      context.next()
    })
    // remove
    driver.before('remove', h.enableFirstAsActive)
    driver.before('remove', h.findRecord)
    driver.before('remove', async context => {
      try {
        await pAll(_.map(context.record._attachments, attachment => {
          return async () => {
            try {
              try {
                await context.resource.file.remove(`${attachment._id}-${this.defaultResize}`)
              } catch (error) {
                logger.error(`Couldn't remove default resized attachment ${attachment._id}-${this.defaultResize}`, error)
              }
              return await context.resource.file.remove(attachment._id)
            } catch (error) {
              throw h.removeAttachmentErrorV2(context.resource.name, context.record._id, attachment._id, error)
            }
          }
        }), {concurrency: 10})
        context.next()
      } catch (error) {
        context.error(error)
      }
    })
    driver.define('remove', ['id'], async context => {
      try {
        const result = await context.resource.json.remove(context.params.id)
        return context.result(result)
      } catch (error) {
        return context.error(h.removeRecordErrorV2(context.resource.name, context.params.id, error))
      }
    })
    driver.after('remove', async (context)=> {
      this.broadcast('remove', context)
      context.next()
    })
    // createAttachment
    driver.before('createAttachment', h.findRecord)
    driver.before('createAttachment', async (context) => {
      if (_.get(context, 'params.object.name.length', 0) === 0) {
        return context.error(h.removeAttachmentErrorV2(context.resource.name, context.record, null, new Error('missing field name')))
      }
      const obj = context.params.object
      obj.filename = path.basename(obj.stream.path)
      let contentType = mime.lookup(_.get(obj, 'fields._filename', obj.filename))
      if (_.includes(['image/jpeg', 'image/gif', 'image/png'], contentType)) {
        const mimeStream = new MimeStream()
        mimeStream.on('type', async (type)=> {
          contentType = mime.lookup(_.get(type, 'ext', obj.filename))
          context.params.object.contentType = _.get(type, 'mime', false) || contentType || 'application/octet-stream'
          // console.log(context.params.object.contentType)
          const field = _.find(context.resource.options.schema, { field: obj.name })
          if (field && field.options && field.options.width && field.options.height) {
            const {stream} = await ImageMin.resizeAttachment(mimeStream, `${field.options.width}x${field.options.height}`, context.params.object.contentType)
            context.params.object.stream = stream
          } else {
            context.params.object.stream = mimeStream
          }
          context.next()
        })
        obj.stream.pipe(mimeStream)
      } else {
        context.params.object.contentType = contentType
        context.next()
      }
    })
    driver.before('createAttachment', (context) => {
      const obj = context.params.object
      const attachmentId = (context.attachmentId = context.resource.options.cms.uuid())
      obj.stream.on('error', async err => {
        try {
          await context.resource.file.remove(attachmentId)
          return context.error(h.createAttachmentErrorV2(context.resource.name, context.params.id, err))
        } catch (error) {
          return context.error(h.removeAttachmentErrorV2(context.resource.name, context.record, attachmentId, error))
        }
      })
      const dstream = digestStream('md5', 'hex', md5sum => context.md5sum = md5sum)
      const writeStream = context.resource.file.write(attachmentId)
      writeStream.on('finish', async ()=> {
        const contentType = _.get(context.params.object, 'contentType', 'application/octet-stream')
        // if (_.includes(['image/jpeg', 'image/gif', 'image/png', 'image/svg+xml'], contentType)) {
        if (_.includes(['image/jpeg', 'image/gif', 'image/png'], contentType)) {
          logger.info('Will cache resized img', `${attachmentId}-${this.defaultResize}`, contentType)
          try {
            const savedFileStream = context.resource.file.read(attachmentId)
            const resizedStream = context.resource.file.write(`${attachmentId}-${this.defaultResize}`)
            const {stream} = await ImageMin.resizeAttachment(savedFileStream, this.defaultResize, contentType)
            stream.pipe(resizedStream)
          } catch {
            context.resource.file.remove(`${attachmentId}-${this.defaultResize}`)
          }
        }
        context.next()
      })
      context.size = 0
      return obj.stream
        .on('data', chunk => context.size += chunk.length)
        .pipe(dstream).pipe(writeStream)
    })
    driver.before('createAttachment', h.lockResource)
    driver.before('createAttachment', h.findRecord)
    // remove old image attachment
    driver.before('createAttachment', async (context) => {
      try {
        const obj = context.params.object
        const field = _.find(context.resource.options.schema, { field: obj.name })
        const maxCount = _.get(field, 'options.maxCount', -1)
        if (_.get(field, 'input') === 'image' && maxCount !== -1) {
          const oldAttachments = _.filter(context.record._attachments, {_name: obj.name})
          if (maxCount === 1) {
            context.record._attachments = _.difference(context.record._attachments, oldAttachments)
            await context.resource.json.update(context.record._id, context.record)
            await pAll(_.map(oldAttachments, attach => {
              return async () => await context.resource.file.remove(attach._id)
            }), {concurrency: 1})
          } else if (_.get(oldAttachments, 'length', 0) + 1 > maxCount) {
            throw new Error('Adding one more attachment would exceed the limit, will cancel')
          }
        }
        context.next()
      } catch (error) {
        context.error(error)
      }
    })
    driver.define('createAttachment', [
      'id',
      'object'
    ], async (context) => {
      const now = Date.now()
      const obj = context.params.object
      const attachment = (context.attachment = {
        _id: context.attachmentId,
        _createdAt: now,
        _updatedAt: now,
        _name: obj.name,
        _contentType: obj.contentType,
        _md5sum: context.md5sum,
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
      try {
        if (_.get(attachment, '_name.length', 0) === 0) {
          throw new Error('missing field name')
        }
        context.record._attachments = _.get(context.record, '_attachments', [])
        context.record._attachments.push(attachment)
        context.record._attachments = _.orderBy(context.record._attachments, ['order'], ['asc'])
        context.record._updatedAt = now
        await context.resource.json.update(context.record._id, context.record)
        h.releaseResource(context)
        return context.result(attachment)
      } catch (error) {
        return context.error(error)
      }
    })
    driver.after('createAttachment', async (context)=> {
      this.broadcast('createAttachment', context)
      context.next()
    })
    // update attachment
    driver.before('updateAttachment', h.findRecord)
    driver.before('updateAttachment', h.findRecordAttachment)
    driver.before('updateAttachment', h.lockResource)
    driver.define('updateAttachment', ['id','aid','object'], async (context) => {
      const now = Date.now()
      const obj = context.params.object
      let foundAttachment = false
      const attachmentIndex = _.findIndex(context.record._attachments, {_id: context.params.aid})
      if (attachmentIndex !== -1) {
        foundAttachment = context.record._attachments[attachmentIndex]
        foundAttachment = _.merge(foundAttachment, obj)
        foundAttachment._updatedAt = now
        context.record._attachments[attachmentIndex] = foundAttachment
      }
      context.record._updatedAt = now
      try {
        await context.resource.json.update(context.record._id, context.record)
        h.releaseResource(context)
        return context.result(foundAttachment)
      } catch (error) {
        return context.error(error)
      }
    })
    driver.after('updateAttachment', async (context)=> {
      this.broadcast('updateAttachment', context)
      context.next()
    })
    // findFile
    driver.define('findFile', ['aid'], (context) => {
      context.stream = context.resource.file.read(context.params.aid)
      return context.result(context.stream)
    })
    // findAttachment
    driver.before('findAttachment', h.findRecord)
    driver.before('findAttachment', h.findRecordAttachment)
    driver.define('findAttachment', ['id', 'aid'], (context) => {
      context.attachment.stream = context.resource.file.read(context.attachment._id)
      return context.result(context.attachment)
    })
    // removeAttachment
    driver.before('removeAttachment', h.findRecord)
    driver.before('removeAttachment', h.findRecordAttachment)
    driver.before('removeAttachment', async context => {
      try {
        await context.resource.file.remove(context.params.aid)
        try {
          await context.resource.file.remove(`${context.params.aid}-${this.defaultResize}`)
        } catch (error) {
          logger.error(`Couldn't remove ${context.params.aid}-${this.defaultResize}`, error)
        }
        return context.next()
      } catch (error) {
        if (error.notFound) {
          return context.error(h.findAttachmentErrorV2(context.resource.name, context.params.id, context.params.aid, error))
        }
        return context.error(h.removeAttachmentErrorV2(context.resource.name, context.params.id, context.params.aid, error))
      }
    })
    driver.before('removeAttachment', h.lockResource)
    driver.before('removeAttachment', h.findRecord)
    driver.define('removeAttachment', ['id', 'aid'], async (context) => {
      context.record._attachments = _.filter(context.record._attachments, attachment => attachment._id !== context.attachment._id)
      context.record._updatedAt = Date.now()
      try {
        await context.resource.json.update(context.record._id, context.record)
        h.releaseResource(context)
        return context.result(true)
      } catch (error) {
        return context.error(error)
      }
    })
    driver.after('removeAttachment', async (context)=> {
      this.broadcast('removeAttachment', context)
      context.next()
    })
    driver.define('cleanAttachment', [], context =>
      context.resource.file.list((error, aidList) => {
        if (error) {
          return context.error(error)
        }
        const stream = context.resource.json.read()
        stream
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
                      await context.resource.file.remove(aid)
                      console.log('removing %s ... ... done (%s/%s)', aid, ++count, aidList.length)
                    } catch (error) {
                      throw h.removeAttachmentErrorV2(context.resource.name, 'unknown', aid, error)
                    }
                  }
                }), {concurrency: 10})
              } catch (error) {
                return context.error(error)
              }
            }
            return context.result(true)
          })
      }))
    return _.extend(this, driver.build())
  }
}

Resource.DEFAULTS = defaults

exports = module.exports = Resource
