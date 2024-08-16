const toArray = require('stream-to-array')
const _ = require('lodash')
const stream = require('stream')
const FileType = require('file-type')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const imageminMozjpeg = require('imagemin-mozjpeg')
const imageminGifsicle = require('imagemin-gifsicle')
const imageminSvgo = require('imagemin-svgo')
const Jimp = require('jimp')

class ImageMin {
  constructor() {
  }

  async getBufferFromStream (attachmentStream) {
    let parts = await toArray(attachmentStream)
    const buffers = parts.map(part => Buffer.isBuffer(part) ? part : Buffer.from(part))
    return Buffer.concat(buffers)
  }

  async resizeAttachment (attachmentStream, resizeOptions) {
    try {
      let buffer = await this.getBufferFromStream(attachmentStream)
      const mimeType = _.get(await FileType.fromBuffer(buffer), 'mime', 'application/octet-stream')
      const image = await Jimp.read(buffer)
      resizeOptions = _.split(resizeOptions, 'x')
      image.resize(
        Number(resizeOptions[0] === 'auto' ? Jimp.AUTO : resizeOptions[0]),
        resizeOptions.length === 2 ? Number(resizeOptions[1]) : Jimp.AUTO
      )
      buffer = await image.getBufferAsync(mimeType)
      let resultStream = false
      buffer = await imagemin.buffer(buffer, {plugins: [imageminMozjpeg(), imageminPngquant(), imageminGifsicle(), imageminSvgo()]})
      resultStream = stream.Readable.from(buffer)
      const contentLength = Buffer.byteLength(buffer)
      return { mimeType, contentLength, stream: resultStream }
    } catch (error) {
      console.error('Error cropping attachment:', error)
      throw error
    }
  }

  async optimizeAttachment  (attachmentStream, cropOptions)  {
    try {
      let buffer = await this.getBufferFromStream(attachmentStream)
      const mimeType = _.get(await FileType.fromBuffer(buffer), 'mime', 'application/octet-stream')
      const image = await Jimp.read(buffer)
      image.crop(cropOptions.left, cropOptions.top, cropOptions.width, cropOptions.height)
      buffer = await image.getBufferAsync(mimeType)
      let resultStream = false
      buffer = await imagemin.buffer(buffer, { plugins: [imageminMozjpeg(), imageminPngquant(), imageminGifsicle(), imageminSvgo()] })
      resultStream = stream.Readable.from(buffer)
      const contentLength = Buffer.byteLength(buffer)
      return { mimeType, contentLength, stream: resultStream }
    } catch (error) {
      console.error('Error cropping attachment:', error)
      throw error
    }
  }
}

exports = module.exports = new ImageMin()