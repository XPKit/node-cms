/*
 * Dynamic resource routes
 */
const through = require('through')
const fs = require('fs-extra')
const _ = require('lodash')
const url = require('url')
const ImageMin = require('../../util/imagemin')

class Routes {
  constructor () {
  }

  injectAttachmentUrl (obj, req) {
    if (!obj) {
      return
    }
    if (_.isArray(obj)) {
      _.each(obj, () => {
        this.injectAttachmentUrl(obj, req)
      })
    } else {
      _.each(obj._attachments, (attachment) => {
        const matches = req.originalUrl.match(/(.*\/api\/[^/]*)/)
        if (matches) {
          const info = url.parse(matches[1])
          attachment.url = [info.pathname,obj._id,'attachments',attachment._id].join('/')
          if (_.get(attachment, 'cropOptions', false)) {
            attachment.cropUrl = `${attachment.url}/cropped`
          }
        }
      })
    }
  }

  stringify (req) {
    let firstTime = true
    return through(function (data) {
      this.injectAttachmentUrl(data, req)
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

  async list (req, res) {
    if (!req.resource) {
      return res.status(500).send('resource not found')
    }
    try {
      if (req.options.limit) {
        const records = await req.resource.list(req.options.query, req.options.fields, _.omit(req.options, ['page','limit']))
        res.set('numRecords', records.length)
      }
      // TODO: hugo - return only the fields we want based on req.options.fields || all fields
      console.warn('list BEFORE - ', req.options.fields)
      try {
        const stream = await req.resource.read(req.options.query, req.options.fields, req.options)
        res.type('json')
        stream.pipe(this.stringify(req)).pipe(res)
      } catch (error) {
        return res.status(error.code || 500).send(error)
      }
    } catch (error) {
      console.error(error)
    }
  }

  async find (req, res) {
    if (!req.resource) {
      return res.status(500).send('resource not found')
    }
    try {
      const record = await req.resource.find(req.params.id, req.options)
      this.injectAttachmentUrl(record, req)
      res.json(record)
    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  }

  async create (req, res) {
    if (!req.is('json')) {
      return res.status(406).send('Not Acceptable')
    }
    if (!req.resource) {
      return res.status(500).send('resource not found')
    }
    try {
      const record = await req.resource.create(req.body, req.options)
      this.injectAttachmentUrl(record, req)
      res.json(record)

    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  }

  async update (req, res) {
    if (!req.is('json')) {
      return res.status(406).send('Not Acceptable')
    }
    if (!req.resource) {
      return res.status(500).send('resource not found')
    }
    try {
      const record = await req.resource.update(req.params.id, req.body, req.options)
      this.injectAttachmentUrl(record, req)
      res.json(record)
    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  }

  async remove (req, res) {
    if (!req.resource) {
      return res.status(500).send('resource not found')
    }
    try {
      res.json(await req.resource.remove(req.params.id))
    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  }

  async findFile (req, res) {
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

  async returnAttachmentStream (res, result, modifiedAttachment = false) {
    result.stream.on('end', () => {
      res.end()
    })
    res.set({ 'Content-Length': _.get(result, modifiedAttachment ? 'contentLength' : '_size', 0) })
    res.type(_.get(result, modifiedAttachment ? 'mimeType' : '_contentType', 'image/jpeg'))
    res.write('', 'binary') // it is trick by kong, handling some naughty unity3d file with browser
    result.stream.pipe(res, { end: false })
  }

  async getAttachment (req, res, key) {
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
      const option = _.get(req.query, key, false)
      if (option && _.includes(['resize', 'cropOptions'], key)) {
        if (key === 'resize') {
          return this.returnAttachmentStream(res, await ImageMin.resizeAttachment(result.stream, option), true)
        } else {
          return this.returnAttachmentStream(res, await ImageMin.optimizeAttachment(result.stream, option), true)
        }
      }
      return this.returnAttachmentStream(res, result)
    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  }

  async findAttachment (req, res) {
    return this.getAttachment(req, res, 'resize')
  }

  async findCroppedAttachment  (req, res) {
    return this.getAttachment(req, res, 'cropOptions')
  }

  async createAttachment (req, res) {
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
        _.set(params, key, field)
      } else {
        _.set(params.fields, key, field)
      }
    })
    // console.warn('will create attachment with ', params)
    try {
      const result = await req.resource.createAttachment(req.params.id, params)
      res.json(result)
    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  }

  async updateAttachment (req, res) {
    if (!req.resource) {
      return res.status(500).send('resource not found')
    }
    if (!req.is('json')) {
      return res.status(406).send('Not Acceptable')
    }
    try {
      const result = await req.resource.updateAttachment(req.params.id, req.params.aid, req.body)
      res.json(result)
    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  }

  async removeAttachment (req, res) {
    if (!req.resource) {
      return res.status(500).send('resource not found')
    }
    try {
      const result = await req.resource.removeAttachment(req.params.id, req.params.aid)
      res.json(result)
    } catch (error) {
      return res.status(error.code || 500).send(error)
    }
  }

}

exports = module.exports = new Routes()

