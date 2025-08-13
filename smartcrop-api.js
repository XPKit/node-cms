/**
 * @fileoverview Test script for SmartCrop API functionality
 * This script tests all SmartCrop methods accessible through the CMS API
 *
 * Additional test: Launch server, create cctImage with ./test/man.jpg, use findAttachment with smart crop and object detection
 */
const _ = require('lodash')
const CMS = require('./index.js')
const fs = require('fs')
const path = require('path')

const smartCropOptions = [
  {
    resize: '500xauto',
    smart: true,
    objectDetection: true
  },
  {
    resize: 'autox500',
    smart: true,
    objectDetection: false
  },
  {
    resize: '500xauto',
    smart: false,
    objectDetection: true
  },
  {
    resize: 'autox500',
    smart: false,
    objectDetection: false
  },
  {
    resize: 'autox500',
    smart: true,
    faceOnly: true,
    facePadding: 0
  },
  {
    resize: 'autox500',
    smart: true,
    faceOnly: true,
    // TODO: hugo - check if face padding working
    facePadding: 100
  }
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
  await api('cctImages').remove(foundRecord._id)
  const record = await api('cctImages').create({ key: 'SmartCrop Test Image' })
  const attachment = await api('cctImages').createAttachment(record._id, {
    name: 'example-attachment',
    stream: fs.createReadStream(fileToProcess),
    fields: { _filename: 'man.jpg' }
  })
  const result = await api('cctImages').findAttachment(record._id, attachment._id, smartCropOptions)
  const basePath = path.join(__dirname, 'test')
  await streamToFile(result.stream, path.join(basePath, outputFilename))
}

async function processAllSmartCropOptions(api) {
  console.log('🧪 [Extra Test] Launch server, create cctImage, use findAttachment with smart crop and object detection')
  const imagePath = path.join(__dirname, 'test', 'man.jpg')
  if (!fs.existsSync(imagePath)) {
    return console.error('Test image ./test/man.jpg not found!')
  }
  console.warn(`Will process ${smartCropOptions.length} smart crop options for image ${imagePath}`)
  let processedImages = 0
  for (const options of smartCropOptions) {
    const mode = _.chain(options).map((val, key) => val ? key : false).compact().join('+').value()
    console.warn(`Will process image with mode = ${mode} and options:`, options)
    await processSmartCrop(api, imagePath, options, `man-smartcrop-${mode}-${options.resize}.jpg`)
    processedImages++
    console.warn(`Processed ${processedImages}/${smartCropOptions.length} smart crop options`)
  }
  console.warn(`All ${processedImages} smart crop options processed successfully`)
}

/**
 * Test SmartCrop API functionality
 */
async function testSmartCropAPI() {
  console.log('🧪 Starting SmartCrop API tests...\n')
  try {
    // Initialize CMS with SmartCrop enabled
    const cms = new CMS({
      data: './data',
      locales: ['enUS'],
      smartCrop: true // Enable SmartCrop
    })
    console.log('✅ Created CMS instance with SmartCrop enabled')
    // Bootstrap the CMS (crucial step)
    await cms.bootstrap()
    console.log('✅ CMS bootstrap completed')
    // Get API access
    const api = cms.api()
    console.log('✅ Got API access\n')
    const testImagePath = path.join(__dirname, 'test', 'man.jpg')
    if (!testImagePath || !fs.existsSync(testImagePath)) {
      return console.error('⚠️  No test image found. Creating a simple test image...')
    }
    const imageBuffer = fs.readFileSync(testImagePath)
    console.log(`📷 Using test image: ${testImagePath} (${imageBuffer.length} bytes)\n`)
    await processAllSmartCropOptions(api)
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
    .then(success => {
      if (success) {
        console.log('\n✅ All tests passed!')
        process.exit(0)
      } else {
        console.log('\n❌ Some tests failed!')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error)
      process.exit(1)
    })
}

module.exports = { testSmartCropAPI }
