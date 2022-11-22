/*
 * Dynamic resource routes
 */

/*
 * Module dependencies
 */

const Busboy = require('busboy')
const through = require('through')
const _ = require('underscore')
const url = require('url')
const Q = require('q')

/*
 * Helpers
 */

const injectAttachmentUrl = function (obj, req) {
  if (obj) {
    if (_.isArray(obj)) {
      _.each(obj, (item) => {
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

/*
 * Find record attachment
 */

exports.findAttachment = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }
  req.resource.findAttachment(req.params.id, req.params.aid, (error, result) => {
    if (error) {
      return res.status(error.code || 500).send(error)
    }

    result.stream.on('error', (error) => {
      if (error) {
        console.error(error)
      }
      res.status(404).end()
    })

    result.stream.on('end', () => {
      res.end()
    })

    res.set({ 'Content-Length': result._size })
    res.type(result._contentType)
    res.write('', 'binary') // it is trick by kong, handling some naughty unity3d file with browser
    result.stream.pipe(res, { end: false })
  })
}

/*
 * Create record attachment
 */

exports.createAttachment = function (req, res) {
  if (!req.resource) {
    return res.status(500).send('resource not found')
  }

  const params = {
    fields: {}
  }

  const busboy = new Busboy({ headers: req.headers })
  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    params.contentType = mimetype
    params.filename = filename
    params.name = fieldname
    params.stream = file

    req.resource.createAttachment(req.params.id, params, (error, result) => {
      if (error) {
        return res.status(error.code || 500).send(error)
      }
      res.json(result)
    })
  })

  busboy.on('field', (fieldname, val, valTruncated, keyTruncated) => {
    params.fields[fieldname] = val
  })

  busboy.on('error', (error) => {
    console.error(error)
  })

  req.pipe(busboy)
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
