/**
 * @fileoverview Unit tests for SmartCrop API functionality
 * Tests all SmartCrop methods using the same logic as smartcrop-api.js
 */
const _ = require('lodash')
const fs = require('fs-extra')
const path = require('node:path')
const sharp = require('sharp')
const { expect } = require('chai')
const { getCMSInstance } = require('./cmsInstance')

const smartCropOptions = [
  { resize: '500xauto', smart: false, objectDetection: true },
  { resize: 'autoxauto', smart: true, objectDetection: false },
  { resize: '500xauto', smart: true, objectDetection: true },
  // { resize: 'autox500', smart: true, objectDetection: false },
  // { resize: '500xauto', smart: false, objectDetection: true },
  // { resize: 'autox500', smart: false, objectDetection: false },
  // { resize: 'autox500', smart: true, faceOnly: true, facePadding: 0 },
  // { resize: 'autox500', smart: true, faceOnly: true, facePadding: 50 },
  // { resize: 'autox500', smart: true, faceOnly: true, facePadding: 100 }
]

function getMode(options) {
  return _.chain(options)
    .map((val, key) => {
      if (!val) return false
      if (key === 'facePadding') return `${key}-${val}`
      return key
    })
    .compact()
    .join('+')
    .value()
}

async function streamToFile(stream, filePath) {
  return await new Promise((resolve, reject) => {
    const writable = fs.createWriteStream(filePath)
    stream.on('error', reject)
    writable.on('error', reject)
    writable.on('finish', () => {
      console.warn(`SAVED ${filePath}`)
      resolve()
    })
    stream.pipe(writable)
  })
}

let api

before(async () => {
  // Clean test data directory before CMS initialization
  if (fs.existsSync('./test/data')) {
    await fs.remove('./test/data')
  }
  const cms = getCMSInstance()
  try {
    api = cms.api()
  } catch {
    api = null
  }
})

describe('SmartCrop API', () => {
  const assetsPath = path.join(__dirname, 'smartCropAssets')
  const testImagePath = path.join(__dirname, 'man.jpg')

  before(async () => {
    if (!fs.existsSync(testImagePath)) {
      throw new Error('Test image needed for tests not found')
    }
    if (fs.existsSync(assetsPath)) {
      await fs.remove(assetsPath)
    }
    await fs.mkdirp(assetsPath)
    if (!api) {
      throw new Error('CMS API not available from cmsInstance.js')
    }
  })

  _.each(smartCropOptions, (options) => {
    const outputFilename = `man-${getMode(options)}-${options.resize}.jpg`
    it(`createAttachment and findAttachment produce same size for ${outputFilename}`, async () => {
      const foundRecord = await api('cctImages').find({ key: 'SmartCrop Test Image' })
      if (foundRecord) {
        await api('cctImages').remove(foundRecord._id)
      }
      const record = await api('cctImages').create({ key: 'SmartCrop Test Image' })
      const attachment = await api('cctImages').createAttachment(record._id, {
        name: 'example-attachment',
        stream: fs.createReadStream(testImagePath),
        fields: { _filename: 'man.jpg' },
        ...options,
      })
      const createPath = path.join(assetsPath, `create-${outputFilename}`)
      const resultStreamCreate = await api('cctImages').findFile(attachment._id)
      await streamToFile(resultStreamCreate, createPath)
      const createMeta = await sharp(createPath).metadata()

      const findPath = path.join(assetsPath, `find-${outputFilename}`)
      const { stream } = await api('cctImages').findAttachment(record._id, attachment._id, options)
      await streamToFile(stream, findPath)
      const findMeta = await sharp(findPath).metadata()

      expect(createMeta.width).to.equal(findMeta.width)
      expect(createMeta.height).to.equal(findMeta.height)
    })
  })
})
