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

const logger = new (require(path.join(__dirname, 'logger')))()

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
  }

  isEqual (updateItem, cmsItem) {
    if (_.isPlainObject(updateItem) || _.isArray(updateItem)) {
      if (_.isArray(updateItem)) {
        if (_.size(updateItem) !== _.size(cmsItem)) {
          return false
        }
      }
      return _.every(_.keys(updateItem), key => {
        const returnValue = cmsItem && this.isEqual(updateItem[key], cmsItem[key])
        return returnValue
      })
    }
    const returnValue = _.isEqual(updateItem, cmsItem)
    return returnValue
  }

  convertKeyToId (value, type, records, name, uniqueKeys, errors) {
    let v
    const uniqueKey = _.first(uniqueKeys)
    switch (type) {
      case 'select':
        v = _.find(records, {
          [uniqueKey]: value
        })
        if (!v) {
          if (errors != null) {
            errors.push('record (' + value + ') not found in resource ' + name)
          }
        }
        return v != null ? v._id : void 0
      case 'multiselect':
        return _.compact(_.map(value, function (key) {
          v = _.find(records, {
            [uniqueKey]: key
          })
          if (!v) {
            if (errors != null) {
              errors.push('record (' + value + ') not found in resource ' + name)
            }
          }
          return v != null ? v._id : void 0
        }))
      default:
        return value
    }
  }

  getUniqueKeys () {
    const uniqueKeyField = _.filter(this.options.schema, item => item.unique || item.xlsxKey)
    if (_.isEmpty(uniqueKeyField)) {
      throw new Error(`${this.name} didn't have unique key field`)
    }
    return _.map(uniqueKeyField, 'field')
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
                let v = _.get(item, `${locale}.${field.field}`)
                if (v) {
                  v = JSON.parse(v)
                }
                _.set(item, `${locale}.${field.field}`, v)
              })
            } else {
              let v = _.get(item, field.field)
              if (v) {
                v = JSON.parse(v)
              }
              _.set(item, field.field, v)
            }
          })
        }
        if (_.isString(field.source)) {
          try {
            const relationUniqueKeys = this.api(field.source).getUniqueKeys()
            const dependencyRecords = await this.api(field.source).list()
            _.each(importList, item => {
              const keyObj = _.pick(item, uniqueKeys)
              if (field.locales) {
                _.each(field.locales, locale => {
                  let v = _.get(item, `${locale}.${field.field}`)
                  let oldKey = v
                  if (_.isEmpty(v)) {
                    return _.set(item, `${locale}.${field.field}`, null)
                  }
                  v = this.convertKeyToId(v, field.input, dependencyRecords, field.source, relationUniqueKeys, errors)
                  if (isCheckRequired && field.required && (_.isUndefined(v) || (!_.isArray(v) && _.isEmpty(v)))) {
                    throw new RequiredFieldError(`record (${JSON.stringify(keyObj)}), required field (${field.field}) and value (${oldKey}) is invalid`)
                  }
                  _.set(item, `${locale}.${field.field}`, v)
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
            if (query) {
              if (v) {
                v = this.convertKeyToId(v, field.input, dependencyRecords, field.source, relationUniqueKeys, errors)
                _.set(query, field.field, v)
              }
            }
          } catch (error) {
            if (error instanceof RequiredFieldError) {
              throw error
            }
            logger.warn(error.message)
          }
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

    return {
      create: createItem,
      update: updateItem,
      remove: removeItem
    }
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
      return context.methods.read(context.params.query, context.params.options, (error, stream) => {
        if (error) {
          console.error(error)
        }
        const results = []
        return stream.pipe(through(
          data => results.push(h.injectDependency(data, context.dependencyMap, this.options, this.resolveMap))
          , () => {
            // logger.warn(`resourceV2 - list =====`, context.params)
            return context.result(results)
          }

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
            return context.error(h.recordNotFoundErrorV2(context.resource.name, context.params.query, error))
          }
          if (error) {
            return context.error(h.recordNotFoundErrorV2(context.resource.name, context.params.query, error))
          }
          result._local = _.get(result, '_id', '').indexOf(options.cms.mid) === 8
          return context.result(h.injectDependency(result, context.dependencyMap, this.options, this.resolveMap))
        })
      }
      // logger.warn(`resourceV2 - find =====`, context.params)
      return context.methods.list(context.params.query, _.extend(context.params.options || {}, {
        page: 0,
        limit: 1
      }), (error, results) => {
        if (error) {
          return context.error(h.listRecordErrorV2(context.resource.name, context.params.query, error))
        }
        // logger.warn(`resourceV2 - find results =====`, context.params, results, error)
        if (!results.length) {
          return context.error(h.listNotFoundErrorV2(context.resource.name, context.params.query))
        }
        return context.result(results[0])
      })
    })

    // exists
    driver.define('exists', ['query'], (context) => {
      if (typeof context.params.query === 'string') {
        return context.resource.json.find(context.params.query, (error, result) => {
          if (error && error.notFound) {
            return context.result(false)
          }
          if (error) {
            return context.error(h.recordNotFoundErrorV2(context.resource.name, context.params.query))
          }
          return context.result(true)
        })
      }
      return context.methods.list(context.params.query, {
        page: 0,
        limit: 1
      }, (error, results) => {
        if (error) {
          return context.error(h.recordNotFoundErrorV2(context.resource.name, context.params.query, error))
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
      result._local = _.get(result, '_id', '').indexOf(options.cms.mid) === 8
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
          return context.error(h.updateRecordErrorV2(context.resource.name, context.params.id, error))
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
            .catch(error => { throw h.removeAttachmentErrorV2(context.resource.name, context.record._id, attachment._id, error) })
        }), {concurrency: 10})
        context.next()
      } catch (error) {
        context.error(error)
      }
    })
    driver.define('remove', ['id'], context => {
      context.resource.json.remove(context.params.id, (error, result) => {
        if (error) {
          return context.error(h.removeRecordErrorV2(context.resource.name, context.params.id, error))
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
      obj.stream.on('error', err =>
      // obj.stream.off('end', next);
        context.resource.file.remove(attachmentId, (error, result) => {
          if (error) {
            return context.error(h.removeAttachmentErrorV2(context.resource.name, context.record, attachmentId, error))
          }
          return context.error(h.createAttachmentErrorV2(context.resource.name, context.params.id, err))
        }))

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
    // remove old image attachment
    driver.before('createAttachment', async (context) => {
      try {
        const obj = context.params.object
        const field = _.find(context.resource.options.schema, { field: obj.name })
        if (_.get(field, 'input') === 'image') {
          const oldAttachments = _.filter(context.record._attachments, {_name: obj.name})
          context.record._attachments = _.difference(context.record._attachments, oldAttachments)
          await Q.ninvoke(context.resource.json, 'update', context.record._id, context.record)
          await pAll(_.map(oldAttachments, attach => {
            return async () => {
              return await Q.ninvoke(context.resource.file, 'remove', attach._id)
            }
          }), {concurrency: 1})
        }
        context.next()
      } catch (error) {
        context.error(error)
      }
    })
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
        _filename: obj.filename,
        _fields: obj.fields
      })
      // let schema = _.find(context.resource.schema, function(item) {
      //   return item.field === attachment._name;
      // });
      context.record._attachments.push(attachment)
      context.record._updatedAt = now
      return context.resource.json.update(context.record._id, context.record, (error, result) => {
        h.releaseResource(context)
        if (error) {
          return context.error(error)
        }
        return context.result(attachment)
      })
    })

    // findFile
    driver.define('findFile', ['aid'], (context) => {
      context.stream = context.resource.file.read(context.params.aid)
      return context.result(context.stream)
    })

    // findAttachment
    driver.before('findAttachment', h.findRecord)
    driver.before('findAttachment', h.findRecordAttachment)
    driver.define('findAttachment', [
      'id',
      'aid'
    ], (context) => {
      context.attachment.stream = context.resource.file.read(context.attachment._id)
      return context.result(context.attachment)
    })

    // removeAttachment
    driver.before('removeAttachment', h.findRecord)
    driver.before('removeAttachment', h.findRecordAttachment)
    driver.before('removeAttachment', context => {
      context.resource.file.remove(context.params.aid, (error, result) => {
        if (error && error.notFound) {
          return context.error(h.findAttachmentErrorV2(context.resource.name, context.params.id, context.params.aid, error))
        }
        if (error) {
          return context.error(h.removeAttachmentErrorV2(context.resource.name, context.params.id, context.params.aid, error))
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
      return context.resource.json.update(context.record._id, context.record, (error, result) => {
        h.releaseResource(context)
        if (error) {
          return context.error(error)
        }
        return context.result(true)
      })
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
                      await Q.ninvoke(context.resource.file, 'remove', aid)
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
