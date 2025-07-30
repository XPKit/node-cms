
const toArray = require('stream-to-array')
const _ = require('lodash')
const stream = require('stream')
const FileType = require('file-type')
const sharp = require('sharp')

/**
 * ImageOptimization - Utility class for image optimization and cropping
 */
class ImageOptimization {
  /**
   * Convert a stream to a buffer
   * @param {stream.Readable} attachmentStream
   * @returns {Promise<Buffer>}
   */
  async getBufferFromStream(attachmentStream) {
    const parts = await toArray(attachmentStream)
    const buffers = _.map(parts, part => _.isBuffer(part) ? part : Buffer.from(part))
    return Buffer.concat(buffers)
  }

  /**
   * Resize an image attachment
   * @param {stream.Readable} attachmentStream
   * @param {string} resizeOptions
   * @param {string|boolean} forceMimeType
   * @returns {Promise<{mimeType: string, contentLength: number, stream: stream.Readable}>}
   */
  async resizeAttachment(attachmentStream, resizeOptions, forceMimeType = false) {
    try {
      const buffer = await this.getBufferFromStream(attachmentStream)
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Input buffer is empty or invalid')
      }
      const fileType = await FileType.fromBuffer(buffer)
      const mimeType = forceMimeType || _.get(fileType, 'mime', 'application/octet-stream')
      const sizeParts = _.split(resizeOptions, 'x')
      console.info('Will resize image with', sizeParts)
      const [width, height] = _.map(sizeParts, dim => dim === 'auto' ? null : Number(dim))
      // Create Sharp instance
      const sharpInstance = sharp(buffer).resize(width, height)
      // Choose output format based on mimeType and apply optimization
      let outBuffer
      if (mimeType === 'image/jpeg') {
        outBuffer = await sharpInstance.jpeg({quality: 85, mozjpeg: true}).toBuffer()
      } else if (mimeType === 'image/png') {
        outBuffer = await sharpInstance.png({compressionLevel: 9, adaptiveFiltering: true}).toBuffer()
      } else if (mimeType === 'image/webp') {
        outBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer()
      } else if (mimeType === 'image/gif') {
        outBuffer = await sharpInstance.gif().toBuffer()
      } else {
        outBuffer = await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer()
      }
      const resultStream = stream.Readable.from(outBuffer)
      const contentLength = Buffer.byteLength(outBuffer)
      return { mimeType, contentLength, stream: resultStream }
    } catch (error) {
      console.error('Error resizing attachment:', error)
      throw error
    }
  }

  /**
   * Crop and optimize an image attachment
   * @param {stream.Readable} attachmentStream
   * @param {object} cropOptions
   * @returns {Promise<{mimeType: string, contentLength: number, stream: stream.Readable}>}
   */
  async optimizeAttachment(attachmentStream, cropOptions) {
    try {
      const buffer = await this.getBufferFromStream(attachmentStream)
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Input buffer is empty or invalid')
      }
      const fileType = await FileType.fromBuffer(buffer)
      const mimeType = _.get(fileType, 'mime', 'application/octet-stream')
      console.warn('Will crop image with', cropOptions)
      if (_.get(cropOptions, 'data.coordinates', false)) {
        cropOptions = cropOptions.data.coordinates
      }
      // Use Sharp for cropping and optimization
      const sharpInstance = sharp(buffer).extract(_.pick(cropOptions, ['left', 'top', 'width', 'height']))
      // Apply format-specific optimization
      let outBuffer
      if (mimeType === 'image/jpeg') {
        outBuffer = await sharpInstance.jpeg({quality: 85,mozjpeg: true,optimiseCoding: true}).toBuffer()
      } else if (mimeType === 'image/png') {
        outBuffer = await sharpInstance.png({compressionLevel: 9,adaptiveFiltering: true}).toBuffer()
      } else if (mimeType === 'image/webp') {
        outBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer()
      } else if (mimeType === 'image/gif') {
        outBuffer = await sharpInstance.gif().toBuffer()
      } else {
        // Default to JPEG for unknown formats
        outBuffer = await sharpInstance.jpeg({ quality: 85, mozjpeg: true }).toBuffer()
      }
      const resultStream = stream.Readable.from(outBuffer)
      const contentLength = Buffer.byteLength(outBuffer)
      return { mimeType, contentLength, stream: resultStream }
    } catch (error) {
      console.error('Error cropping attachment:', error)
      throw error
    }
  }

  /**
   * Smart crop and optimize an image attachment
   * @param {stream.Readable} attachmentStream
   * @param {string|object} targetSize
   * @param {object} options
   * @returns {Promise<{mimeType: string, contentLength: number, stream: stream.Readable, cropResult: object}>}
   */
  async smartCropAttachment(attachmentStream, targetSize, options = {}) {
    try {
      const smartCrop = require('./smartcrop')
      const buffer = await this.getBufferFromStream(attachmentStream)
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('Input buffer is empty or invalid')
      }
      const fileType = await FileType.fromBuffer(buffer)
      const mimeType = _.get(fileType, 'mime', 'application/octet-stream')
      console.info('Will smart crop image to', targetSize)
      if (!_.includes(['image/jpeg', 'image/png', 'image/gif'], mimeType)) {
        throw new Error(`Smart crop not supported for ${mimeType}`)
      }
      const result = await smartCrop.applyCrop(buffer, targetSize, {
        detectFaces: true,
        minScale: options.minScale || 0.8,
        ...options
      })
      let optimizedBuffer = result.buffer
      const resultStream = stream.Readable.from(optimizedBuffer)
      const contentLength = Buffer.byteLength(optimizedBuffer)
      console.info(`Smart crop completed: ${result.originalSize.width}x${result.originalSize.height} -> ${result.targetSize.width}x${result.targetSize.height}`)
      if (result.cropResult && result.cropResult.facesDetected > 0) {
        console.info(`Smart crop detected ${result.cropResult.facesDetected} face(s)`)
      }
      return {
        mimeType: result.mimeType,
        contentLength,
        stream: resultStream,
        cropResult: result.cropResult
      }
    } catch (error) {
      console.error('Error smart cropping attachment:', error)
      throw error
    }
  }
}

module.exports = new ImageOptimization()
