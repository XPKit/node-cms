/*
 * Module dependencies
 */

const _ = require('lodash')
const through = require('through')
const sift = require('sift')
const Lru = require('lru-cache')
const queue = require('queue-async')
const pAll = require('p-all')
const Q = require('q')
const path = require('path')
const logger = new (require(path.join(__dirname, 'logger')))()

/*
 * More or less deep merge [treats arrays as immutable objects]
 */
exports.merge = function (target, object) {
  _.forEach(object, (value, key) => {
    target[key] = (_.isObject(value) && !_.isArray(value))
      ? exports.merge((target[key] || {}), value) : value
  })
  return target
}

/*
 * Query regex support
 *
 * @example:
 *   > GET http://localhost:3000/api/articles?query={"enUS.title":{"$regex":"ko"}}
 *   < [{
 *       "_id": "hrtzk23mhpf3vze9yr2ye3vp",
 *       "_createdAt": 1392777154210,
 *       "_updatedAt": 1392802904076,
 *       "_publishedAt": 1392777322322,
 *       "_doc": {
 *         "enUS": {
 *           "_id": "hrtzk23mhpf3vze9yr2ye3vp",
 *           "title": "kong"
 *         }
 *       },
 *       "_attachments": []
 *     }]
 */

const regexCache = new Lru(40)

sift.use({
  operators: {
    regex (rx, target) {
      if (!regexCache.has(rx)) {
        regexCache.set(rx, new RegExp(rx, 'i'))
      }
      return regexCache.get(rx).test(target) ? 0 : -1
    }
  }
})

const filterQuery = function (query, options) {
  // logger.warn(`filterQuery`, query, options)
  let page = options.page
  let limit = options.limit

  page = page ? parseInt(page, 10) : 1
  limit = limit ? parseInt(limit, 10) : null

  page = page < 1 ? 1 : page
  limit = (limit && limit < 1) ? 100 : limit

  let offset = limit ? (page - 1) * limit : 0
  let remainder = limit

  if (!query) {
    return through(function (data) {
      // eslint-disable-next-line eqeqeq
      if (remainder != void 0 && remainder < 0) {
        return
      }
      offset--
      if (offset < 0) {
      // eslint-disable-next-line eqeqeq
        if (remainder == void 0 || remainder > 0) {
          this.queue(data)
        }
        // eslint-disable-next-line eqeqeq
        remainder != void 0 && remainder--
      }
    })
  }
  query = sift(query)

  return through(function (data) {
    // eslint-disable-next-line eqeqeq
    if (remainder != void 0 && remainder < 0) {
      return
    }
    if (query(_.extend({}, data, data._doc))) {
      offset--
      if (offset < 0) {
      // eslint-disable-next-line eqeqeq
        if (remainder == void 0 || remainder > 0) {
          this.queue(data)
        }
        // eslint-disable-next-line eqeqeq
        remainder != void 0 && remainder--
      }
    }
  })
}

/*
 * Errors
 */

const duplicateFound = exports.duplicateFound = function (fieldName) {
  return { code: 400, message: `Field '${fieldName}' is duplicated`, data: arguments }
}

exports.notFoundError = function () {
  return { code: 404, message: 'Not Found', data: arguments }
}

exports.databaseError = function () {
  return { code: 500, message: 'Database Error', data: arguments }
}

exports.uploadError = function () {
  return { code: 500, message: 'Upload Error', data: arguments }
}

exports.localeNotSpecifiedError = function () {
  return { code: 406, message: 'Locale is not specified', data: arguments }
}

exports.openReadStream = function (context) {
  context.stream = context.resource.json.read(context.params.query, context.params.options)
  context.next()
}

// exports.stringify = function(context) {
//   context._result = context.getResult().pipe(stringify(context.params.options.stringify));
//   context.next();
// };

exports.profile = function (context) {
  const start = Date.now()
  context.on('end', () => {
    const duration = Date.now() - start
    logger.log(`${context.endpoint.name} took ${duration}ms.`)
  })
  context.next()
}

exports.filterUnpublished = function (context) {
  const disabled = context.params.options.unpublished ||
    !context.options.filterUnpublished

  if (disabled) {
    return context.next()
  }

  const now = Date.now()

  context.stream = context.stream.pipe(through(function (data) {
    if (data._publishedAt && data._publishedAt < now) {
      this.queue(data)
    }
  }))

  context.next()
}

exports.filterQuery = function (context) {
  context.stream = context.stream.pipe(filterQuery(context.params.query, context.params.options))
  context.next()
}

exports.findRecord = function (context) {
  context.resource.json.find(context.params.id, (error, result) => {
    if (error && (error.notFound || (error.error && error.error.notFound))) {
      return context.error(recordNotFoundErrorV2(context.resource.name, context.params.id, error))
    }
    if (error) {
      return context.error(findRecordErrorV2(context.resource.name, context.params.id, error))
    }
    context.record = result
    context.next()
  })
}

exports.checkResourceLimits = function (context) {
  const maxCount = _.get(context.resource, 'options.maxCount', 0)
  if (maxCount > 0) {
    context.resource.list({}, (error, result) => {
      if (!error && _.get(result, 'length', 0) >= maxCount) {
        context._result = _.first(result)
        context.end(context._result)
      } else {
        context.next()
      }
    })
  } else {
    context.next()
  }
}

exports.enableFirstAsActive = function (context) {
  const currentId = _.get(context, 'params.id')
  const activeField = _.get(context, 'options.activeField')
  if (!_.isUndefined(currentId) && !_.isUndefined(activeField)) {
    const query = {
      $and: [
        {
          _id: {
            $eq: currentId
          }
        }
      ]
    }
    _.set(query, `$and[1].${activeField}.$eq`, true)
    context.options.resource.list(query, (error, result) => {
      if (error) {
        logger.error(error)
      }
      if (result.length === 0) {
        context.next()
      } else {
        context.options.resource.list({
          _id: {
            $not: {
              $eq: currentId
            }
          }
        }, {
          page: 0,
          limit: 1
        }, (error, result) => {
          if (error) {
            logger.error(error)
          }
          const firstElement = _.first(result)
          const data = {
            _id: firstElement._id
          }
          _.set(data, `${activeField}`, true)
          context.options.resource.update(firstElement._id, data, (error, result) => {
            if (error) {
              logger.error(error)
            }
            context.next()
          })
        })
      }
    })
  } else {
    context.next()
  }
}

exports.leaveOneActive = function (context) {
  let currentId = _.get(context, 'params.object._id')
  if (_.isUndefined(currentId)) {
    currentId = _.get(context, 'params.id')
  }
  const activeField = _.get(context, 'options.activeField')
  if (!_.isUndefined(currentId) && !_.isUndefined(activeField) && _.get(context.params.object, `${activeField}`, false) === true) {
    const query = {
      $and: [
        {
          _id: {
            $not: {
              $eq: currentId
            }
          }
        }
      ]
    }
    _.set(query, `$and[1].${activeField}.$eq`, true)
    context.options.resource.list(query, (error, result) => {
      if (error) {
        logger.error(error)
      }
      if (result.length > 0) {
        const q = queue(1)
        _.forEach(result, (item) => {
          q.defer((item, cb) => {
            const data = {
              _id: item._id
            }
            _.set(data, `${activeField}`, false)
            context.options.resource.update(item._id, data, (error, result) => {
              if (error) {
                logger.error(error)
              }
              cb()
            })
          }, item)
        })
        q.awaitAll((error) => {
          if (!_.isEmpty(error)) {
            return context.error({
              code: 400,
              message: error
            })
          }
          return context.options.resource.update(currentId, {}, (error, result) => {
            if (error) {
              logger.error(error)
            }
            context.next()
          })
        })
      } else {
        context.next()
      }
    })
  } else {
    context.next()
  }
}

exports.checkUniqueFields = function (context) {
  const uniqueFields = []
  _.forEach(_.get(context, 'resource.options.schema', []), (field) => {
    const isUnique = _.get(field, 'unique', false)
    if (isUnique) {
      uniqueFields.push(field)
    }
  })
  const record = _.get(context, 'params.object', false)
  const hasToCheck = []
  _.forEach(uniqueFields, (item) => {
    let locales = []
    if (item.localised) {
      locales = _.get(context, 'resource.options.locales', [])
      locales = _.map(locales, locale => `${locale}.${item.field}`)
    }
    if (locales.length === 0) {
      locales = [item.field]
    }
    _.forEach(locales, (locale) => {
      if (_.has(record, locale)) {
        hasToCheck.push({
          path: locale,
          value: _.get(record, locale)
        })
      }
    })
  })
  if (hasToCheck.length === 0) {
    return context.next()
  }
  const q = queue(1)
  _.forEach(hasToCheck, (item) => {
    q.defer((next) => {
      const data = {}
      _.set(data, item.path, item.value)
      context.resource.find(data, (error, result) => {
        if (error) {
          // logger.error(error)
        }
        if (result && result._id !== context.params.id) {
          next(item.path)
        } else {
          next()
        }
      })
    })
  })
  q.awaitAll((path) => {
    if (path) {
      return context.error(duplicateFound(path))
    }
    return context.next()
  })
}

exports.lockResource = function (context) {
  context.on('error', (error) => {
    if (error) {
      logger.error(error)
    }
    exports.releaseResource(context)
  })
  if (!context.resource.locked) {
    context.resource.locked = true
    context.next()
  } else {
    context.resource.taskQueue = context.resource.taskQueue || []
    context.resource.taskQueue.push(() => {
      context.next()
    })
  }
}

exports.releaseResource = function (context) {
  if (context.resource.locked) {
    if (!_.isEmpty(context.resource.taskQueue)) {
      const task = context.resource.taskQueue.pop()
      task()
    } else {
      context.resource.locked = false
    }
  }
}

exports.findRecordAttachment = function (context) {
  context.attachment = _.find(context.record._attachments, attachment => attachment._id === context.params.aid)
  if (!context.attachment) {
    context.error(findAttachmentErrorV2(context.resource.name, context.params.id, context.params.aid))
  } else {
    context.next()
  }
}

exports.normalizeSchema = function (context) {
  const locales = context.resource.options.locales
  const localised = !!(locales && locales.length)

  if (!localised) {
    return context.next()
  }

  if (context.params.options && context.params.options.locale) { // has locale ?locale=enUS { title: 'ABC', category: 123 }
    let newObject = {}
    _.forEach(context.resource.options.schema, item => {
      let value = _.get(context.params.object, item.field)
      if (!_.isUndefined(value)) {
        if (!_.isUndefined(item.localised) ? item.localised : true) {
          _.set(newObject, `${context.params.options.locale}.${item.field}`, value)
        } else {
          _.set(newObject, item.field, value)
        }
      }
    })
    context.params.object = newObject
    context.next()
  } else { // doesn't have locale { enUS: { title: 'ABC' }, category: 123 }
    context.next()
  }
}

exports.getDependencyItems = async function (context) {
  try {
    if (_.isEmpty(this.resolveMap)) {
      return context.next()
    }

    await pAll(_.map(this.resolveMap, (item, key) => {
      return async () => {
        let result = await Q.ninvoke(item, 'list')
        context.dependencyMap = context.dependencyMap || {}
        context.dependencyMap[key] = context.dependencyMap[key] || {}
        context.dependencyMap[key] = _.keyBy(result, item => item._id)
      }
    }))

    _.each(context.dependencyMap, (list, key) => {
      const resource = this.resolveMap[key]
      if (resource) {
        const schema = _.cloneDeep(resource.options.schema)
        _.each(list, item => {
          exports.injectDependencyByItem(item, context.dependencyMap, schema, this.options)
        })
      }
    })
    return context.next()
  } catch (error) {
    context.error(error)
  }
}

exports.injectDependency = function (item, dependencyMap, options, resolveMap) {
  if (_.isEmpty(resolveMap)) {
    return item
  }
  const schema = JSON.parse(JSON.stringify(options.schema))
  return exports.injectDependencyByItem(item, dependencyMap, schema, options)
}

exports.injectDependencyByItem = function (item, dependencyMap, schema, options) {
  _.forEach(schema, (field) => {
    if (!_.includes(['select', 'multiselect'], field.input)) {
      return
    }
    if (!_.isString(field.source)) {
      return
    }
    if (!_.includes(_.keys(dependencyMap), field.source)) {
      return
    }

    if (options.locales && (field.localised !== false)) {
      field.locales = options.locales
    }
    if (_.isEmpty(field.locales)) {
      const fieldKey = field.field
      const value = _.get(item, fieldKey)
      if (_.isUndefined(value)) {
        return
      }

      switch (field.input) {
        case 'select': return _.set(item, fieldKey, dependencyMap[field.source][value])
        case 'multiselect': return _.set(item, fieldKey, _.map(value, id => dependencyMap[field.source][id]))
      }
    } else {
      _.forEach(field.locales, (locale) => {
        const fieldKey = `${locale}.${field.field}`
        const value = _.get(item, fieldKey)
        if (_.isUndefined(value)) {
          return
        }

        switch (field.input) {
          case 'select': return _.set(item, fieldKey, dependencyMap[field.source][value])
          case 'multiselect': return _.set(item, fieldKey, _.map(value, id => dependencyMap[field.source][id]))
        }
      })
    }
  })
  return item
}

// version 2 error handling
exports.listRecordErrorV2 = function (resource, query, error) {
  return { code: 500, message: `list resource (${_.isString(query) ? query : JSON.stringify(query)}) error in resource (${resource})`, data: arguments }
}
exports.listNotFoundErrorV2 = function (resource, query, error) {
  return { code: 404, message: `list resource with query (${_.isString(query) ? query : JSON.stringify(query)}) not found in resource (${resource})`, data: arguments }
}
const recordNotFoundErrorV2 = exports.recordNotFoundErrorV2 = function (resource, query, error) {
  return { code: 404, message: `record (${_.isString(query) ? query : JSON.stringify(query)}) not found in resource (${resource}) error`, data: arguments }
}
const findRecordErrorV2 = exports.findRecordErrorV2 = function (resource, query, error) {
  return { code: 500, message: `record (${_.isString(query) ? query : JSON.stringify(query)}) not found in resource (${resource}) error`, data: arguments }
}
exports.updateRecordErrorV2 = function (resource, id, error) {
  return { code: 500, message: `record (${id}) update in resource (${resource}) error`, data: arguments }
}
exports.removeRecordErrorV2 = function (resource, id, error) {
  return { code: 500, message: `remove record (${id}) in resource (${resource}) error`, data: arguments }
}
exports.removeAttachmentErrorV2 = function (resource, id, aid, error) {
  return { code: 500, message: `record (${id}) remove attachment (${aid}) in resource (${resource}) error`, data: arguments }
}
const findAttachmentErrorV2 = exports.findAttachmentErrorV2 = function (resource, id, aid, error) {
  return { code: 404, message: `record (${id}) find attachment (${aid}) in resource (${resource}) error`, data: arguments }
}
exports.createAttachmentErrorV2 = function (resource, id, error) {
  return { code: 500, message: `record (${id}) create attachment in resource (${resource}) error`, data: arguments }
}
