/**
 * @fileoverview Test script for SmartCrop API functionality
 * This script tests all SmartCrop methods accessible through the CMS API
 *
 * Additional test: Launch server, create cctImage with ./test/man.jpg, use findAttachment with smart crop and object detection
 */
const _ = require('lodash')
const CMS = require('./index.js')
const fs = require('fs-extra')
const path = require('node:path')
const sharp = require('sharp')

const smartCropOptions = [
  {
    resize: '500xauto',
    smart: false,
    objectDetection: true,
  },
  {
    resize: 'autoxauto',
    smart: true,
    objectDetection: false,
  },
  {
    resize: '500xauto',
    smart: true,
    objectDetection: true,
  },
  {
    resize: 'autox500',
    smart: true,
    objectDetection: false,
  },
  {
    resize: '500xauto',
    smart: false,
    objectDetection: true,
  },
  {
    resize: 'autox500',
    smart: false,
    objectDetection: false,
  },
  {
    resize: 'autox500',
    smart: true,
    faceOnly: true,
    facePadding: 0,
  },
  {
    resize: 'autox500',
    smart: true,
    faceOnly: true,
    facePadding: 50,
  },
  {
    resize: 'autox500',
    smart: true,
    faceOnly: true,
    facePadding: 100,
  },
]

async function streamToFile(stream, filePath) {
  return await new Promise((resolve, reject) => {
    const writable = fs.createWriteStream(filePath)
    stream.on('error', reject)
    writable.on('error', reject)
    writable.on('finish', resolve)
    stream.pipe(writable)
  })
}

async function processSmartCrop(api, fileToProcess, smartCropOptions, outputFilename) {
  const foundRecord = await api('cctImages').find({ key: 'SmartCrop Test Image' })
  if (foundRecord) {
    await api('cctImages').remove(foundRecord._id)
  }
  const record = await api('cctImages').create({ key: 'SmartCrop Test Image' })
  // Pass all smartCropOptions directly to createAttachment
  const attachment = await api('cctImages').createAttachment(record._id, {
    name: 'example-attachment',
    stream: fs.createReadStream(fileToProcess),
    fields: { _filename: 'man.jpg' },
    ...smartCropOptions,
  })
  // Download the processed attachment (direct result from createAttachment)
  const resultStreamCreate = await api('cctImages').findFile(attachment._id)
  const basePath = path.join(__dirname, 'test', 'smartCropAssets')
  const createPath = path.join(basePath, `create-${outputFilename}`)
  const findPath = path.join(basePath, `find-${outputFilename}`)
  await streamToFile(resultStreamCreate, createPath)
  // Now test findAttachment with the same options
  const resultFind = await api('cctImages').findAttachment(record._id, attachment._id, smartCropOptions)
  await streamToFile(resultFind.stream, findPath)
  // Compare image dimensions
  const createMeta = await sharp(createPath).metadata()
  const findMeta = await sharp(findPath).metadata()
  if (createMeta.width !== findMeta.width || createMeta.height !== findMeta.height) {
    throw new Error(
      `Image size mismatch for ${outputFilename}: create=${createMeta.width}x${createMeta.height}, find=${findMeta.width}x${findMeta.height}`,
    )
  }
}

function getMode(options) {
  return _.chain(options)
    .map((val, key) => {
      if (!val) {
        return false
      } else if (key === 'facePadding') {
        return `${key}-${val}`
      }
      return key
    })
    .compact()
    .join('+')
    .value()
}

async function processAllSmartCropOptions(api, testImagePath) {
  console.log('🧪 [Extra Test] Launch server, create cctImage, use findAttachment with smart crop and object detection')
  console.warn(`Will process ${smartCropOptions.length} smart crop options for image ${testImagePath}`)
  let processedImages = 0
  for (const options of smartCropOptions) {
    const mode = getMode(options)
    console.warn(`Will process image with mode = ${mode} and options:`, options)
    await processSmartCrop(api, testImagePath, options, `man-${mode}-${options.resize}.jpg`)
    processedImages++
    console.warn(`Processed ${processedImages}/${smartCropOptions.length} smart crop options`)
  }
  console.warn(`All ${processedImages} smart crop options processed successfully`)
}

async function initCms() {
  const cms = new CMS({
    data: './data',
    locales: ['enUS'],
    smartCrop: true, // Enable SmartCrop
  })
  console.log('✅ Created CMS instance with SmartCrop enabled')
  await cms.bootstrap()
  console.log('✅ CMS bootstrap completed')
  return cms.api()
}

async function createFolder() {
  const assetsPath = path.join(__dirname, 'test', 'smartCropAssets')
  if (fs.existsSync(assetsPath)) {
    await fs.remove(assetsPath)
  }
  await fs.mkdirp(assetsPath)
}

/**
 * Test SmartCrop API functionality
 */
async function testSmartCropAPI() {
  console.log('🧪 Starting SmartCrop API tests...\n')
  try {
    const testImagePath = path.join(__dirname, 'test', 'man.jpg')
    if (!testImagePath || !fs.existsSync(testImagePath)) {
      throw new Error('Test image needed for tests not found')
    }
    await createFolder()
    const api = await initCms()
    await processAllSmartCropOptions(api, testImagePath)
    return true
  } catch (error) {
    console.error('❌ SmartCrop API test failed:', error)
    console.error('Stack trace:', error.stack)
    return false
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testSmartCropAPI()
    .then((success) => {
      if (success) {
        console.log('\n✅ All tests passed!')
        process.exit(0)
      } else {
        console.log('\n❌ Some tests failed!')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ Test runner failed:', error)
      process.exit(1)
    })
}

module.exports = { testSmartCropAPI }
