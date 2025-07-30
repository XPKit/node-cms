/*
 * Dynamic resource routes
 */
const fs = require('fs-extra')
const _ = require('lodash')
const url = require('url')
const h = require('../../helpers')

const ImageOptimization = require('../../util/imageOptimization')
const escapeRegExp = require('../../util/escapeRegExp')
const pAll = require('p-all')

const logger = new (require('img-sh-logger'))()

/*
 * Helpers
 */

const injectAttachmentUrl = function (obj, req) {
  if (!obj) {
    return
  } else if (_.isArray(obj)) {
    _.each(obj, () => {
      injectAttachmentUrl(obj, req)
    })
    return
  }
  let keys = []
  let attachmentFieldsToMerge = {}
  const attachmentsFields = _.get(req, 'resource.options._attachmentFields', {})
  // Ensure _attachments is always an array
  if (!_.isArray(obj._attachments)) {
    obj._attachments = []
  }
  _.each(obj._attachments, (attachment) => {
    const rootPath = `${attachment._name}`
    const rootPathString = escapeRegExp(rootPath)
    let hasField = _.find(attachmentsFields, fieldPath => fieldPath === rootPathString)
    if (!hasField) {
      _.each(attachmentsFields, (attachmentsField, attachmentsFieldsRegEx) => {
        const regex = new RegExp(attachmentsFieldsRegEx, 'g')
        const found = rootPath.match(regex)
        if (_.get(found, 'length', 0) > 0) {
          hasField = attachmentsField
          return false
        }
      })
    }
    const matches = req.originalUrl.match(/(.*\/api\/[^/]*)/)
    if (matches) {
      const info = url.parse(matches[1])
      attachment.url = [info.pathname,
        obj._id,
        'attachments',
        attachment._id].join('/')
      if (_.get(attachment, 'cropOptions', false)) {
        attachment.cropUrl = `${attachment.url}/cropped`
      }
    }
    const attachments = _.get(attachmentFieldsToMerge, attachment._name, [])
    attachments.push(_.omit(attachment, ['_name']))
    let hasDirtyAttachments = false
    if (hasField && _.get(hasField, 'localised', false) !== false) {
      if (_.endsWith(attachment._name, hasField.field)) {
        const firstLocale = _.get(req, 'resource.options.locales[0]', 'enUS')
        attachment._name = `${attachment._name}.${firstLocale}`
        hasDirtyAttachments = 'forced-localised'
      }
    } else {
      if (hasField && _.split(attachment._name, '.').length > 1 && !_.endsWith(attachment._name, hasField.field)) {
        attachment._name = _.join(_.split(attachment._name, '.').slice(0, -1), '.')
        hasDirtyAttachments = 'forced-unlocalised'
      }
    }
    if (hasDirtyAttachments) {
      _.each(attachments, attachment => attachment.dirty = hasDirtyAttachments)
    }
    if (hasField) {
      const maxCount = _.get(hasField, 'options.maxCount', 0)
      if (maxCount > 0 && attachments.length > maxCount) {
        let i = 1
        _.each(attachments, attachment => {
          if (i > maxCount) {
            attachment.dirty = 'max-count-overpassed'
          }
          i = i + 1
        })
      }
    }
    _.each(attachments, attachment => attachment._isAttachment = true)
    if (_.get(attachment, '_name.length', 0) > 0) {
      _.set(
        attachmentFieldsToMerge,
        attachment._name,
        _.uniqBy(
          _.concat(
            _.get(attachmentFieldsToMerge, attachment._name, []),
            attachments
          ),
          attachment => attachment._id)
      )
      keys.push(attachment._name)
    } else {
      logger.warn('A weird attachment has been found:', {attachment, attachments})
    }
  })
  delete obj._attachments
  _.each(keys, (key)=> {
    const attachments = _.get(attachmentFieldsToMerge, key, [])
    _.set(obj, key, _.orderBy(attachments, ['order'], ['asc']))
  })
}

/*
 * List resource records
 */
exports.list = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    if (req.options.limit) {
      const list = await req.resource.list(req.options.query, _.omit(req.options, ['page', 'limit']))
      res.set('numRecords', list.length)
    }
    try {
      const results = await req.resource.read(req.options.query, req.options)
      _.each(results, (result)=> injectAttachmentUrl(result, req))
      res.json(results)
    } catch (error) {
      return res.status(_.get(error, 'code', 500)).send(error)
    }
  } catch (error) {
    logger.error(error)
  }
}

const handleStreamError = function (res, stream) {
  stream.on('error', (error) => {
    if (error) {
      logger.error(error)
    }
    res.status(404).end()
  })
}

/*
 * Get resource record by id
 */
exports.find = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    const record = await req.resource.find(req.params.id, req.options)
    injectAttachmentUrl(record, req)
    res.json(record)
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

/*
 * Create a new resource record
 */
exports.create = async function (req, res) {
  if (!req.is('json')) {
    return res.status(406).send('Not Acceptable')
  }
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    const record = await req.resource.create(req.body, req.options)
    injectAttachmentUrl(record, req)
    res.json(record)
  } catch (error) {
    console.error('REST API: Error creating resource record', error)
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

/*
 * Update resource record
 */
exports.update = async function (req, res) {
  if (!req.is('json')) {
    return res.status(406).send('Not Acceptable')
  }
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    const record = await req.resource.update(req.params.id, req.body, req.options)
    injectAttachmentUrl(record, req)
    res.json(record)
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

/*
 * Remove resource record
 */
exports.remove = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    const result = await req.resource.remove(req.params.id)
    res.json(result)
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

/*
 * Find file
 */
exports.findFile = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    const result = await req.resource.findFile(req.params.aid)
    res.write('', 'binary')
    result.pipe(res)
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

const returnAttachmentStream = async (res, result, modifiedAttachment = false) => {
  result.stream.on('end', () => { res.end() })
  res.set({ 'Content-Length': _.get(result, modifiedAttachment ? 'contentLength' : '_size', 0) })
  let contentType = _.get(result, modifiedAttachment ? 'mimeType' : '_contentType', 'image/jpeg')
  if (!_.isString(contentType)) {
    contentType = 'image/jpeg'
  }
  res.type(contentType)
  res.write('', 'binary')
  result.stream.pipe(res, { end: false })
}

/*
 * Find record attachment and resizes it if req.query.resize exists
 */
exports.findAttachment = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    const { resize, smart } = req.query
    const result = await req.resource.findAttachment(req.params.id, req.params.aid, {resize, smart})
    handleStreamError(res, result.stream)
    const resizeOptions = _.get(req.query, 'resize', false)
    const contentType = _.get(result, '_contentType', 'application/octet-stream')
    if (resizeOptions && h.resizeOptionsValid(resizeOptions) && _.includes(['image/jpeg', 'image/gif', 'image/png'], contentType)) {
      // Check for cached attachment with requested dimensions
      const cacheKey = `${req.params.aid}-${resizeOptions}`
      try {
        // Try to read cached resized image
        const resizedStream = req.resource.file.read(cacheKey)
        const buffer = await ImageOptimization.getBufferFromStream(resizedStream)
        res.type(contentType)
        return res.send(buffer)
      } catch {
        // If not cached, create, cache, and return
        try {
          const resized = await ImageOptimization.resizeAttachment(result.stream, resizeOptions)
          // Save resized image to cache
          const cacheStream = req.resource.file.write(cacheKey)
          resized.stream.pipe(cacheStream)
          // Wait for caching to finish before sending response
          await new Promise((resolve, reject) => {
            cacheStream.on('finish', resolve)
            cacheStream.on('error', reject)
          })
          // Send resized image
          const buffer = await ImageOptimization.getBufferFromStream(req.resource.file.read(cacheKey))
          res.type(contentType)
          return res.send(buffer)
        } catch (error) {
          logger.info(`Couldn't cache or resize ${cacheKey}, will send back the original attachment instead`)
          logger.error('Error:', error)
          return returnAttachmentStream(res, result)
        }
      }
    }
    returnAttachmentStream(res, result)
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

/*
 * Find cropped record attachment
 */
exports.findCroppedAttachment = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    const result = await req.resource.findAttachment(req.params.id, req.params.aid)
    result.stream.on('error', (error) => {
      if (error) {
        logger.error(error)
      }
      res.status(404).end()
    })
    const cropOptions = _.get(result, 'cropOptions', false)
    if (cropOptions) {
      return returnAttachmentStream(res, await ImageOptimization.optimizeAttachment(result.stream, cropOptions), true)
    }
    returnAttachmentStream(res, result)
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

/*
 * Create record attachment
 */
exports.createAttachment = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  const uploadedAttachment = _.first(req.files)
  const params = {
    fields: {},
    contentType: uploadedAttachment.mimetype,
    filename: uploadedAttachment.originalname,
    name: uploadedAttachment.fieldname,
    stream: fs.createReadStream(uploadedAttachment.path)
  }
  _.each(req.body, (field, key) => {
    if (key === 'cropOptions') {
      _.set(params, key, _.omit(JSON.parse(field), ['updated']))
    } else if (key === 'order') {
      _.set(params, key, _.toInteger(field))
    } else {
      _.set(params.fields, key, field)
    }
  })
  try {
    const result = await req.resource.createAttachment(req.params.id, params)
    res.json(result)
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

/*
 * Update record attachment
 */
exports.updateAttachment = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  if (!req.is('json')) {
    return res.status(406).send('Not Acceptable')
  }
  try {
    if (req.params.aid) {
      const result = await req.resource.updateAttachment(req.params.id, req.params.aid, req.body)
      res.json(result)
    } else {
      let attachments = req.body
      if (!_.isArray(attachments)) {
        attachments = [attachments]
      }
      const results = []
      for (const attachment of attachments) {
        results.push(await req.resource.updateAttachment(req.params.id, attachment._id, attachment))
      }
      res.json(results.length === 1 ? _.first(results) : results)
    }
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

/*
 * Remove record attachment
 */
exports.removeAttachment = async function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  try {
    if (req.params.aid) {
      const result = await req.resource.removeAttachment(req.params.id, req.params.aid)
      res.json(result)
    } else {
      let attachments = req.body
      if (!_.isArray(attachments)) {
        attachments = [attachments]
      }
      const nbAttachments = attachments.length
      const results = await pAll(_.map(attachments, attachment => {
        return async () => await req.resource.removeAttachment(req.params.id, attachment._id)
      }), {concurrency: 5})
      res.json(nbAttachments === 1 ? _.first(results) : results)
    }
  } catch (error) {
    return res.status(_.get(error, 'code', 500)).send(error)
  }
}

