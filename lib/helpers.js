const _ = require('lodash')
const through = require('through')
const sift = require('sift')
const Lru = require('lru-cache')
const queue = require('queue-async')
const pAll = require('p-all')
const Q = require('q')
const autoBind = require('auto-bind')
const logger = new (require('img-sh-logger'))()
/*
   * Query regex support
   *
   * @example:
   *   > GET http://localhost:3000/api/articles?query={"enUS.title":{"$regex":"ko"}}
   *   < [{
   *       "_id": "hrtzk23mhpf3vze9yr2ye3vp",
   *       "_createdAt": 1392777154210,
   *       "_updatedAt": 1392802904076,
   *       "_doc": {
   *         "enUS": {
   *           "_id": "hrtzk23mhpf3vze9yr2ye3vp",
   *           "title": "kong"
   *         }
   *       },
   *       "_attachments": []
   *     }]
   */
const filterQueryContext = (query, options) => {
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
      if (remainder != void 0 && remainder < 0) {
        return
      }
      offset--
      if (offset < 0) {
        if (remainder == void 0 || remainder > 0) {
          this.queue(data)
        }
        remainder != void 0 && remainder--
      }
    })
  }
  query = sift(query)
  return through(function (data) {
    if (remainder != void 0 && remainder < 0) {
      return
    }
    if (query(_.extend({}, data, data._doc))) {
      offset--
      if (offset < 0) {
        if (remainder == void 0 || remainder > 0) {
          this.queue(data)
        }
        remainder != void 0 && remainder--
      }
    }
  })
}
class Helpers {
  constructor() {
    autoBind(this)
    this.regexCache = new Lru(40)
    this.initializeSift()
  }
  initializeSift() {
    sift.use({
      operators: {
        regex: (rx, target) => {
          if (!this.regexCache.has(rx)) {
            this.regexCache.set(rx, new RegExp(rx, 'i'))
          }
          return this.regexCache.get(rx).test(target) ? 0 : -1
        }
      }
    })
  }
  /**
 * Checks if a resize option string is valid.
 * Accepts formats: [number]x[number], autox[number], [number]xauto (max 5 digits)
 * @param {string} resizeOptions
 * @returns {boolean}
 */
  resizeOptionsValid(resizeOptions) {
    const regex = /^(([1-9][0-9]{0,4})x([1-9][0-9]{0,4})|(autox([1-9][0-9]{0,4}))|(([1-9][0-9]{0,4})xauto))$/
    return regex.test(resizeOptions)
  }
  // More or less deep merge [treats arrays as immutable objects]
  merge(target, object) {
    _.each(object, (value, key) => {
      target[key] = (_.isObject(value) && !_.isArray(value)) ? this.merge((target[key] || {}), value) : value
    })
    return target
  }
  // Errors
  duplicateFound(fieldName) {
    return { code: 400, message: `Field '${fieldName}' is duplicated`, data: arguments }
  }
  notFoundError() {
    return { code: 404, message: 'Not Found', data: arguments }
  }
  databaseError() {
    return { code: 500, message: 'Database Error', data: arguments }
  }
  uploadError() {
    return { code: 500, message: 'Upload Error', data: arguments }
  }
  localeNotSpecifiedError() {
    return { code: 406, message: 'Locale is not specified', data: arguments }
  }

  openReadStream(context) {
    context.stream = context.resource.json.read(context.params.query, context.params.options)
    context.next()
  }

  profile(context) {
    const start = Date.now()
    context.on('end', () => {
      const duration = Date.now() - start
      logger.log(`${context.endpoint.name} took ${duration}ms.`)
    })
    context.next()
  }
  filterQuery(context) {
    context.stream = context.stream.pipe(filterQueryContext(context.params.query, context.params.options))
    context.next()
  }
  async findRecord(context) {
    try {
      context.record = await context.resource.json.find(context.params.id)
      context.next()
    } catch (error) {
      if (error.notFound || (error.error && error.error.notFound)) {
        return context.error(this.recordNotFoundError(context.resource.name, context.params.id, error))
      }
      return context.error(this.findRecordError(context.resource.name, context.params.id, error))
    }
  }
  checkResourceLimits(context) {
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
  enableFirstAsActive(context) {
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
            context.options.resource.update(firstElement._id, data, (error) => {
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
  leaveOneActive(context) {
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
          _.each(result, (item) => {
            q.defer((item, cb) => {
              const data = {
                _id: item._id
              }
              _.set(data, `${activeField}`, false)
              context.options.resource.update(item._id, data, (error) => {
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
            return context.options.resource.update(currentId, {}, (error) => {
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
  checkUniqueFields(context) {
    const uniqueFields = []
    _.each(_.get(context, 'resource.options.schema', []), (field) => {
      const isUnique = _.get(field, 'unique', false)
      if (isUnique) {
        uniqueFields.push(field)
      }
    })
    const record = _.get(context, 'params.object', false)
    const hasToCheck = []
    _.each(uniqueFields, (item) => {
      let locales = []
      if (item.localised) {
        locales = _.get(context, 'resource.options.locales', [])
        locales = _.map(locales, locale => `${item.field}.${locale}`)
      }
      if (locales.length === 0) {
        locales = [item.field]
      }
      _.each(locales, (locale) => {
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
    _.each(hasToCheck, (item) => {
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
        return context.error(this.duplicateFound(path))
      }
      return context.next()
    })
  }
  lockResource(context) {
    const self = this
    context.on('error', (error) => {
      if (error) {
        logger.error(error)
      }
      self.releaseResource(context)
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
  releaseResource(context) {
    if (context.resource.locked) {
      if (!_.isEmpty(context.resource.taskQueue)) {
        const task = context.resource.taskQueue.pop()
        task()
      } else {
        context.resource.locked = false
      }
    }
  }
  findRecordAttachment(context) {
    context.attachment = _.find(context.record._attachments, attachment => attachment._id === context.params.aid)
    if (!context.attachment) {
      context.error(this.findAttachmentError(context.resource.name, context.params.id, context.params.aid))
    } else {
      context.next()
    }
  }
  normalizeSchema(context) {
    const locales = context.resource.options.locales
    const localised = !!(locales && locales.length)
    if (!localised) {
      return context.next()
    }
    if (context.params.options && context.params.options.locale) { // has locale ?locale=enUS { title: 'ABC', category: 123 }
      let newObject = {}
      _.each(context.resource.options.schema, item => {
        const value = _.get(context.params.object, item.field)
        if (!_.isUndefined(value)) {
          let key = item.field
          if (!_.isUndefined(item.localised) ? item.localised : true) {
            key = `${context.params.options.locale}.${item.field}`
          }
          _.set(newObject, key, value)
        }
      })
      context.params.object = newObject
    }
    context.next()
  }

  checkRegexPattern(record, pattern) {
    const regex = new RegExp(pattern)
    const matches = new Set()
    function checkObject(obj, path = '') {
      if (!obj || !_.isObject(obj)) {
        if (regex.test(path)) {
          // Extract the base path up to the matched pattern
          const match = path.match(regex)
          if (match) {
            // Get only the first two segments of the path
            const segments = match[0].split('.')
            const baseKey = segments.slice(0, 2).join('.')
            matches.add(baseKey)
          }
        }
        return
      }
      if (_.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          checkObject(obj[i], `${path}[${i}]`)
        }
        return
      }
      for (const key in obj) {
        const newPath = path ? `${path}.${key}` : key
        checkObject(obj[key], newPath)
      }
    }

    checkObject(record)
    return Array.from(matches)
  }

  async getDependencyItems(context) {
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
            this.injectDependencyByItem(item, context.dependencyMap, schema, this.options)
          })
        }
      })
      return context.next()
    } catch (error) {
      context.error(error)
    }
  }
  injectDependency(item, dependencyMap, options, resolveMap) {
    if (_.isEmpty(resolveMap)) {
      return item
    }
    const schema = JSON.parse(JSON.stringify(options.schema))
    const res = this.injectDependencyByItem(item, dependencyMap, schema, options)
    // NOTE: Handles relations in paragraphs
    _.each(options._relations, (relation, regex)=> {
      const matches = this.checkRegexPattern(res, regex)
      _.each(matches, (match)=> {
        const foundRecord = _.find(_.get(dependencyMap, relation.source, []), {_id: _.get(res, match, '??')})
        if (foundRecord) {
          _.set(res, match, foundRecord)
          // console.warn(`${match} has been set in record`)
        }
      })
    })
    return res
  }
  setValueInItem(item, dependencyMap, field, fieldKey) {
    const value = _.get(item, fieldKey)
    if (_.isUndefined(value)) {
      return
    } else if (field.input === 'select') {
      return _.set(item, fieldKey, dependencyMap[field.source][value])
    } else if (field.input === 'multiselect') {
      return _.set(item, fieldKey, _.map(value, id => dependencyMap[field.source][id]))
    }
  }

  injectDependencyByItem(item, dependencyMap, schema, options) {
    _.each(schema, (field) => {
      if (!_.includes(['select', 'multiselect'], field.input) ||
      !_.isString(field.source) ||
      !_.includes(_.keys(dependencyMap), field.source)) {
        return
      }
      if (options.locales && (field.localised !== false)) {
        field.locales = options.locales
      }
      if (_.isEmpty(field.locales)) {
        this.setValueInItem(item, dependencyMap, field, field.field)
      } else {
        _.each(field.locales, (locale) => {
          this.setValueInItem(item, dependencyMap, field, `${field.field}.${locale}`)
        })
      }
    })
    return item
  }

  queryToLog(query) {
    return _.isString(query) ? query : JSON.stringify(query)
  }
  listRecordError(resource, query) {
    return { code: 500, message: `list resource (${this.queryToLog(query)}) error in resource (${resource})`, data: arguments }
  }
  listNotFoundError(resource, query) {
    return { code: 404, message: `list resource with query (${this.queryToLog(query)}) not found in resource (${resource})`, data: arguments }
  }
  recordNotFoundError(resource, query) {
    return { code: 404, message: `record (${this.queryToLog(query)}) not found in resource (${resource}) error`, data: arguments }
  }
  findRecordError(resource, query) {
    return { code: 500, message: `record (${this.queryToLog(query)}) not found in resource (${resource}) error`, data: arguments }
  }
  updateRecordError(resource, id) {
    return { code: 500, message: `record (${id}) update in resource (${resource}) error`, data: arguments }
  }
  removeRecordError(resource, id) {
    return { code: 500, message: `remove record (${id}) in resource (${resource}) error`, data: arguments }
  }
  removeAttachmentError(resource, id, aid) {
    return { code: 500, message: `record (${id}) remove attachment (${aid}) in resource (${resource}) error`, data: arguments }
  }
  findAttachmentError(resource, id, aid) {
    return { code: 404, message: `record (${id}) find attachment (${aid}) in resource (${resource}) error`, data: arguments }
  }
  createAttachmentError(resource, id) {
    return { code: 500, message: `record (${id}) create attachment in resource (${resource}) error`, data: arguments }
  }
}
// Export a new instance of the Helpers class
module.exports = new Helpers()
