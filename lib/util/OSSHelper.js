const path = require('path')
const fs = require('fs')
const _ = require('lodash')
const OSS = require('ali-oss')
const { Transform } = require('stream')
const logger = new (require('img-sh-logger'))()

class OSSHelper {
  constructor () {
  }

  getOSSConfig = (accessKeyId) => {
    const ossFilePath = path.resolve(`./oss-config-${accessKeyId}.json`)
    if (!fs.existsSync(ossFilePath)) {
      throw new Error(`OSS config file not found for accessKeyId: ${accessKeyId}`)
    }
    return JSON.parse(fs.readFileSync(ossFilePath, 'utf-8'))
  }

  getOSSFilepath = (context, field) => {
    const ossPath = field.options.oss.path.replace('%{resource}', context.resource.name).replace('%{_id}', context.params.id)
    const filenameFromContext = _.get(context, 'attachment._filename', _.get(context, 'params.object.fields._filename', null))
    const filename = _.split(filenameFromContext, '.').shift()
    const extension = _.split(filenameFromContext, '.').pop()
    const ossFilename = `${field.options.oss.filename.replace('%{filename}', filename)}.${extension}`
    return path.join(ossPath, ossFilename).replaceAll('\\', '/')
  }

  getStore = (field) => {
    const ossOptions = _.get(field, 'options.oss', {})
    if (!_.has(ossOptions, 'accessKeyId')) {
      throw new Error('OSS options must include accessKeyId')
    }
    return new OSS(this.getOSSConfig(ossOptions.accessKeyId))
  }

  uploadStream = async (context, field) => {
    const store = this.getStore(field)
    const ossFilepath = this.getOSSFilepath(context, field)
    let size = 0
    const counter = new Transform({
      transform(chunk, encoding, callback) {
        size += chunk.length
        callback(null, chunk)
      }
    })
    const countingStream = context.params.object.stream.pipe(counter)
    const result = await store.putStream(ossFilepath, countingStream)
    logger.info(`Successfully uploaded to OSS: ${result.name}`)
    return { ...result, size }
  }

  getStream = async (context, field) => {
    try {
      const store = this.getStore(field)
      const ossFilepath = this.getOSSFilepath(context, field)
      const result = await store.getStream(ossFilepath)
      return {stream: result.stream, size: result.res.headers['content-length']}
    } catch (error) {
      return context.error(error)
    }
  }

  uploadFile = async (context, field) => {
    const store = this.getStore(field)
    const ossFilepath = this.getOSSFilepath(context, field)
    const fileContent = _.get(context, 'params.object.buffer', false) || _.get(context, 'params.object.path', false)
    if (!fileContent) {
      return context.error(new Error('No file content found in buffer or path for uploadFile.'))
    }
    store.put(ossFilepath, fileContent).then((result) => {
      logger.info(`Successfully uploaded to OSS: ${result.name}`)
      context.next()
    }).catch((error) => {
      context.error(error)
    })
  }

  getFile = async (context, field) => {
    try {
      const store = this.getStore(field)
      const ossFilepath = this.getOSSFilepath(context, field)
      const result = await store.get(ossFilepath)
      context.attachment.buffer = result.content
    } catch (error) {
      return context.error(error)
    }
  }

  deleteFile = async (context, field) => {
    const store = this.getStore(field)
    const ossFilepath = this.getOSSFilepath(context, field)
    await store.delete(ossFilepath)
    logger.info(`Successfully deleted from OSS: ${ossFilepath}`)
  }
}

module.exports = OSSHelper
