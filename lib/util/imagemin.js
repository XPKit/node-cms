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

  async resizeAttachment (attachmentStream, resizeOptions, forceMimeType = false) {
    try {
      let buffer = await this.getBufferFromStream(attachmentStream)
      const mimeType = forceMimeType ? forceMimeType : _.get(await FileType.fromBuffer(buffer), 'mime', 'application/octet-stream')
      const image = await Jimp.read(buffer)
      resizeOptions = _.split(resizeOptions, 'x')
      console.info('Will resize image with', resizeOptions)
      const [width, height] = resizeOptions.map(dim => (dim === 'auto' ? Jimp.AUTO : Number(dim)))
      image.resize(
        width,
        height
      )
      buffer = await image.getBufferAsync(mimeType)
      let resultStream = false
      buffer = await imagemin.buffer(buffer, {plugins: [imageminMozjpeg(), imageminPngquant(), imageminGifsicle(), imageminSvgo()]})
      resultStream = stream.Readable.from(buffer)
      const contentLength = Buffer.byteLength(buffer)
      return { mimeType, contentLength, stream: resultStream }
    } catch (error) {
      console.error('Error resizing attachment:', error)
      throw error
    }
  }

  async optimizeAttachment  (attachmentStream, cropOptions)  {
    try {
      let buffer = await this.getBufferFromStream(attachmentStream)
      const mimeType = _.get(await FileType.fromBuffer(buffer), 'mime', 'application/octet-stream')
      const image = await Jimp.read(buffer)
      console.warn('Will crop image with', cropOptions)
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
