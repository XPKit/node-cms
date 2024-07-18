/*
 * Dynamic resource routes
 */
const through = require('through')
const fs = require('fs-extra')
const _ = require('lodash')
const url = require('url')
const Q = require('q')

const ImageMin = require('../../util/imagemin')

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

exports.list = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  Q()
    .then(() => {
      if (req.options.limit) {
        return Q.ninvoke(req.resource, 'list', req.options.query, _.omit(req.options, ['page',
          'limit']))
          .then(list => res.set('numRecords', list.length))
      }
    })
    .then(() => {
      req.resource.read(req.options.query, req.options, (error, stream) => {
        if (error) {
          return res.status(error.code || 500).send(error)
        }
        res.type('json')
        stream.pipe(stringify(req)).pipe(res)
      })
    })
    .catch(console.error)
}

/*
 * Get resource record by id
 */

exports.find = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.find(req.params.id, req.options, (error, record) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    injectAttachmentUrl(record, req)
    res.json(record)
  })
}

/*
 * Create a new resource record
 */

exports.create = function (req, res) {
  if (!req.is('json')) {
    return res.status(406).send('Not Acceptable')
  }
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.create(req.body, req.options, (error, record) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    injectAttachmentUrl(record, req)
    res.json(record)
  })
}

/*
 * Update resource record
 */

exports.update = function (req, res) {
  if (!req.is('json')) {
    return res.status(406).send('Not Acceptable')
  }
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.update(req.params.id, req.body, req.options, (error, record) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    injectAttachmentUrl(record, req)
    res.json(record)
  })
}

/*
 * Remove resource record
 */

exports.remove = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.remove(req.params.id, (error, result) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    res.json(result)
  })
}

/*
 * Find file
 */
exports.findFile = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.findFile(req.params.aid, (error, result) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    // res.type(result._contentType);
    res.write('', 'binary') // it is trick by kong, handling some naughty unity3d file with browser
    result.pipe(res)
  })
}

const returnAttachmentStream = async (res, result, modifiedAttachment = false) => {
  result.stream.on('end', () => {
    res.end()
  })
  res.set({ 'Content-Length': _.get(result, modifiedAttachment ? 'contentLength' : '_size', 0) })
  res.type(_.get(result, modifiedAttachment ? 'mimeType' : '_contentType', 'image/jpeg'))
  res.write('', 'binary') // it is trick by kong, handling some naughty unity3d file with browser
  result.stream.pipe(res, { end: false })
}

/*
 * Find record attachment and resizes it if req.query.resize exists
 */

exports.findAttachment = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.findAttachment(req.params.id, req.params.aid, async (error, result) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    result.stream.on('error', (error) => {
      if (error) {
        console.error(error)
      }
      res.status(404).end()
    })
    const resizeOptions = _.get(req.query, 'resize', false)
    if (resizeOptions) {
      return returnAttachmentStream(res, await ImageMin.resizeAttachment(result.stream, resizeOptions), true)
    }
    returnAttachmentStream(res, result)
  })
}

/*
 * Find cropped record attachment
 */

exports.findCroppedAttachment = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.findAttachment(req.params.id, req.params.aid, async (error, result) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
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
  })
}

/*
 * Create record attachment
 */

exports.createAttachment = function (req, res) {
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
      _.set(params, key, field)
    } else {
      _.set(params.fields, key, field)
    }
  })
  // console.warn('will create attachment with ', params)
  req.resource.createAttachment(req.params.id, params, (error, result) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    res.json(result)
  })
}

/*
 * Update record attachment
 */

exports.updateAttachment = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  if (!req.is('json')) {
    return res.status(406).send('Not Acceptable')
  }
  req.resource.updateAttachment(req.params.id, req.params.aid, req.body, (error, result) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    res.json(result)
  })
}

/*
 * Remove record attachment
 */

exports.removeAttachment = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.removeAttachment(req.params.id, req.params.aid, (error, result) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }
    res.json(result)
  })
}
