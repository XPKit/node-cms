/*
 * Dynamic resource routes
 */
const through = require('through')
const fs = require('fs-extra')
const _ = require('lodash')
const url = require('url')

const ImageMin = require('../../util/imagemin')
const pAll = require('p-all')

/*
 * Helpers
 */

const injectAttachmentUrl = function (obj, req) {
  if (obj) {
    if (_.isArray(obj)) {
      _.each(obj, () => {
        injectAttachmentUrl(obj, req)
      })
    } else {
      let keys = []
      let attachmentFieldsToMerge = {}
      _.each(obj._attachments, (attachment) => {
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
        _.set(attachmentFieldsToMerge, attachment._name, attachments)
        keys.push(attachment._name)
      })
      delete obj._attachments
      _.each(keys, (key)=> {
        const attachments = _.get(attachmentFieldsToMerge, key, [])
        _.set(obj, key, _.orderBy(attachments, ['order'], ['asc']))
      })
    }
  }
}

/*
 * Encode a stream of objects to JSON
 *
 * @return {Stream} through
 */

const stringify = function (req) {
  let firstTime = true
  return through(function (data) {
    injectAttachmentUrl(data, req)
    if (firstTime) {
      firstTime = false
      this.queue('[')
      this.queue(JSON.stringify(data, null, 2))
    } else {
      this.queue(`,${JSON.stringify(data, null, 2)}`)
    }
  }, function () {
    if (firstTime) {
      this.queue('[')
    }
    this.queue(']')
    this.queue(null)
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
      const stream = await req.resource.read(req.options.query, req.options)
      res.type('json')
      stream.pipe(stringify(req)).pipe(res)
    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  } catch (error) {
    console.error(error)
  }
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
    return res.status(error.code || 500).send(error)
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
    return res.status(error.code || 500).send(error)
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
    return res.status(error.code || 500).send(error)
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
    return res.status(error.code || 500).send(error)
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
    // res.type(result._contentType);
    res.write('', 'binary') // it is trick by kong, handling some naughty unity3d file with browser
    result.pipe(res)
  } catch (error) {
    return res.status(error.code || 500).send(error)
  }
}

const returnAttachmentStream = async (res, result, modifiedAttachment = false) => {
  result.stream.on('end', () => { res.end() })
  res.set({ 'Content-Length': _.get(result, modifiedAttachment ? 'contentLength' : '_size', 0) })
  res.type(_.get(result, modifiedAttachment ? 'mimeType' : '_contentType', 'image/jpeg'))
  res.write('', 'binary') // it is trick by kong, handling some naughty unity3d file with browser
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
    const result = await req.resource.findAttachment(req.params.id, req.params.aid)
    result.stream.on('error', (error) => {
      if (error) {
        console.error(error)
      }
      res.status(404).end()
    })
    const resizeOptions = _.get(req.query, 'resize', false)
    if (resizeOptions && _.includes(['image/jpeg', 'image/gif', 'image/png', 'image/svg+xml'], _.get(result, '_contentType', 'application/octet-stream'))) {
      return returnAttachmentStream(res, await ImageMin.resizeAttachment(result.stream, resizeOptions), true)
    }
    returnAttachmentStream(res, result)
  } catch (error) {
    return res.status(error.code || 500).send(error)
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
        console.error(error)
      }
      res.status(404).end()
    })
    const cropOptions = _.get(result, 'cropOptions', false)
    if (cropOptions) {
      return returnAttachmentStream(res, await ImageMin.optimizeAttachment(result.stream, cropOptions), true)
    }
    returnAttachmentStream(res, result)
  } catch (error) {
    return res.status(error.code || 500).send(error)

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
  // res.json({message: 'test'})
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
  // console.warn('will create attachment with ', _.omit(params, ['stream']))
  try {
    const result = await req.resource.createAttachment(req.params.id, params)
    res.json(result)
  } catch (error) {
    return res.status(error.code || 500).send(error)
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
    return res.status(error.code || 500).send(error)
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
    return res.status(error.code || 500).send(error)
  }
}
