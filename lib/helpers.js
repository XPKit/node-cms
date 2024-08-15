const _ = require('lodash')
const through = require('through')
const queue = require('queue-async')
const autoBind = require('auto-bind')
const pAll = require('p-all')
const Q = require('q')
const path = require('path')
const logger = new (require(path.join(__dirname, 'logger')))()
const filterQuery = require('./filterQuery')
const Errors = require('./errors')


class Helper extends Errors {
  constructor () {
    super()
    autoBind(this)
  }

  /*
  * More or less deep merge [treats arrays as immutable objects]
  */
  merge (target, object) {
    _.forEach(object, (value, key) => {
      target[key] = (_.isObject(value) && !_.isArray(value))
        ? exports.merge((target[key] || {}), value) : value
    })
    return target
  }

  setSelectValues (dependencyMap, field, item, fieldKey, value) {
    if (field.input === 'select') {
      return _.set(item, fieldKey, dependencyMap[field.source][value])
    } else if (field.input === 'multiselect') {
      return _.set(item, fieldKey, _.map(value, id => dependencyMap[field.source][id]))
    }
  }

  openReadStream (context) {
    context.stream = context.resource.json.read(context.params.query, context.params.options)
    context.next()
  }

  profile (context) {
    const start = Date.now()
    context.on('end', () => {
      const duration = Date.now() - start
      logger.log(`${context.endpoint.name} took ${duration}ms.`)
    })
    context.next()
  }

  filterUnpublished (context) {
    const disabled = context.params.options.unpublished || !context.options.filterUnpublished
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

  filterQuery (context) {
    context.stream = context.stream.pipe(filterQuery(context.params.query, context.params.options))
    context.next()
  }

  findRecord (context) {
    context.resource.json.find(context.params.id, (error, result) => {
      if (error && (error.notFound || (error.error && error.error.notFound))) {
        return context.error(this.recordNotFoundError(context.resource.name, context.params.id, error))
      }
      if (error) {
        return context.error(this.findRecordError(context.resource.name, context.params.id, error))
      }
      context.record = result
      context.next()
    })
  }
  checkResourceLimits (context) {
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

  enableFirstAsActive (context) {
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

  leaveOneActive (context) {
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
          // TODO: hugo - replace with pall
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
          // TODO: hugo - replace with pall
          q.awaitAll((error) => {
            if (!_.isEmpty(error)) {
              return context.error(this.getError(400, error))
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

  checkUniqueFields (context) {
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
      // TODO: hugo - replace with pall
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
        return context.error(this.duplicateFoundError(path))
      }
      return context.next()
    })
  }

  lockResource (context) {
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

  releaseResource (context) {
    if (context.resource.locked) {
      if (!_.isEmpty(context.resource.taskQueue)) {
        const task = context.resource.taskQueue.pop()
        task()
      } else {
        context.resource.locked = false
      }
    }
  }

  findRecordAttachment (context) {
    context.attachment = _.find(context.record._attachments, attachment => attachment._id === context.params.aid)
    if (!context.attachment) {
      context.error(this.findAttachmentError(context.resource.name, context.params.id, context.params.aid))
    } else {
      context.next()
    }
  }

  normalizeSchema (context) {
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

  async getDependencyItems (context) {
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

  injectDependency (item, dependencyMap, options, resolveMap) {
    if (_.isEmpty(resolveMap)) {
      return item
    }
    const schema = JSON.parse(JSON.stringify(options.schema))
    return exports.injectDependencyByItem(item, dependencyMap, schema, options)
  }

  injectDependencyByItem (item, dependencyMap, schema, options) {
    _.forEach(schema, (field) => {
      if (!_.includes(['select', 'multiselect'], field.input) || !_.isString(field.source) || !_.includes(_.keys(dependencyMap), field.source)) {
        return
      }
      if (options.locales && (field.localised !== false)) {
        field.locales = options.locales
      }
      if (_.isEmpty(field.locales)) {
        const fieldKey = field.field
        const value = _.get(item, fieldKey)
        return _.isUndefined(value) ? null : this.setSelectValues(dependencyMap, field, item, fieldKey, value)
      }
      _.forEach(field.locales, (locale) => {
        const fieldKey = `${locale}.${field.field}`
        const value = _.get(item, fieldKey)
        return _.isUndefined(value) ? null : this.setSelectValues(dependencyMap, field, item, fieldKey, value)
      })
    })
    return item
  }

}

exports = module.exports = new Helper()


