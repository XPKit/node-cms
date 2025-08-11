/**
 * @fileoverview Smart cropping utility with face and object detection
 * Provides intelligent image cropping using face detection, object detection, and content-aware algorithms
 */

const _ = require('lodash')
const { createCanvas, loadImage } = require('canvas')
const sharp = require('sharp')
const logger = new (require('img-sh-logger'))()

/**
 * Smart cropping utility class
 * Combines face detection, object detection, and content-aware cropping for optimal results
 */
class SmartCrop {
  constructor() {
    this.faceDetector = null
    this.objectDetector = null
    this.isInitialized = false
    this.faceDetectionAvailable = false
    this.objectDetectionAvailable = false
  }

  /**
   * Initialize face and object detection models
   * @param {Object} [cmsConfig] - CMS configuration object
   * @returns {Promise<void>}
   */
  async initialize(cmsConfig = null) {
    if (this.isInitialized) {
      return
    }

    // Check if smart cropping is enabled in configuration
    const smartCropEnabled = cmsConfig && _.get(cmsConfig, 'smartCrop', false)
    if (!smartCropEnabled) {
      logger.info('Smart cropping disabled in configuration - face and object detection will not be available')
      this.faceDetector = null
      this.objectDetector = null
      this.faceDetectionAvailable = false
      this.objectDetectionAvailable = false
      this.isInitialized = true
      return
    }

    try {
      // Import TensorFlow.js Node backend only when needed
      logger.info('Smart cropping enabled - loading TensorFlow.js Node backend...')
      const tf = require('@tensorflow/tfjs-node')
      logger.info('Initializing TensorFlow.js Node.js backend...')
      // Ensure TensorFlow.js is ready and use the Node.js backend
      await tf.ready()
      // The tfjs-node package automatically sets up the optimal backend
      logger.info(`TensorFlow.js backend: ${tf.getBackend()}`)
      // Initialize face detection
      logger.info('Initializing face detection model...')
      try {
        // Try using standalone BlazeFace model for better Node.js compatibility
        logger.info('Attempting to load BlazeFace model...')
        const blazeface = require('@tensorflow-models/blazeface')
        this.faceDetector = await blazeface.load()
        logger.info('BlazeFace model loaded successfully')
        this.faceDetectionAvailable = true
        logger.info('Face detection model initialized successfully')
      } catch (faceError) {
        logger.error('Face detection error details:', {
          message: faceError.message,
          stack: faceError.stack,
          errorType: faceError.constructor.name
        })
        logger.warn('Face detection initialization failed, will fallback to object detection only')
        this.faceDetectionAvailable = false
        this.faceDetector = null
      }
      // Initialize object detection
      logger.info('Initializing object detection model...')
      const cocoSsd = require('@tensorflow-models/coco-ssd')
      this.objectDetector = await cocoSsd.load()
      this.objectDetectionAvailable = true
      logger.info('Object detection model initialized successfully')
      this.isInitialized = true
    } catch (error) {
      logger.warn('Detection models initialization failed:', error.message)
      logger.info('Smart cropping will use intelligent center crop instead')
      this.faceDetector = null
      this.objectDetector = null
      this.faceDetectionAvailable = false
      this.objectDetectionAvailable = false
      this.isInitialized = true
    }
  }

  /**
   * Detect objects in an image buffer
   * @param {Buffer} imageBuffer - The image buffer
   * @returns {Promise<Array>} Array of detected objects with bounding boxes
   */
  async detectObjects(imageBuffer) {
    if (!this.objectDetector || !this.objectDetectionAvailable) {
      return []
    }
    try {
      // Load image into canvas for TensorFlow.js
      const image = await loadImage(imageBuffer)
      const canvas = createCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0)
      // Detect objects
      const objects = await this.objectDetector.detect(canvas)
      logger.info(`Detected ${objects.length} object(s)`)
      if (objects.length > 0) {
        logger.info('Object detection results:', objects.map(obj => ({
          class: obj.class,
          score: obj.score.toFixed(3),
          bbox: obj.bbox
        })))
      }
      return objects
    } catch (error) {
      // If we get runtime errors, disable object detection to avoid repeated errors
      if (error.message.includes('Kernel') || error.message.includes('not registered')) {
        logger.warn('Object detection runtime error detected, disabling object detection for this session')
        this.objectDetectionAvailable = false
        this.objectDetector = null
      } else {
        logger.warn('Object detection failed:', error.message)
      }
      return []
    }
  }

  /**
   * Detect faces in an image buffer
   * @param {Buffer} imageBuffer - The image buffer
   * @returns {Promise<Array>} Array of detected faces with bounding boxes
   */
  async detectFaces(imageBuffer) {
    if (!this.faceDetector || !this.faceDetectionAvailable) {
      return []
    }
    try {
      // Load image into canvas for TensorFlow.js
      const image = await loadImage(imageBuffer)
      const canvas = createCanvas(image.width, image.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(image, 0, 0)
      // Detect faces
      const faces = await this.faceDetector.estimateFaces(canvas)
      logger.info(`Detected ${faces.length} face(s)`)
      if (faces.length > 0) {
        // Convert BlazeFace format to standardized format
        const standardizedFaces = faces.map(face => {
          if (face.topLeft && face.bottomRight) {
            // BlazeFace format
            return {
              box: {
                xMin: face.topLeft[0],
                yMin: face.topLeft[1],
                xMax: face.bottomRight[0],
                yMax: face.bottomRight[1],
                width: face.bottomRight[0] - face.topLeft[0],
                height: face.bottomRight[1] - face.topLeft[1]
              },
              score: face.probability ? face.probability[0] : 1.0
            }
          } else if (face.box) {
            // Already in correct format
            return face
          } else {
            logger.warn('Unknown face detection format:', face)
            return null
          }
        }).filter(face => face !== null)

        logger.info('Face detection result:', JSON.stringify(standardizedFaces[0].box, null, 2))
        return standardizedFaces
      }
      return faces
    } catch (error) {
      // If we get runtime errors, disable face detection to avoid repeated errors
      logger.warn('Face detection error details:', {
        message: error.message,
        stack: error.stack?.split('\n')[0], // First line of stack for context
        errorType: error.constructor.name
      })

      if (error.message.includes('Kernel') ||
          error.message.includes('not registered') ||
          error.message.includes('Input tensor') ||
          error.message.includes('shape') ||
          error.message.includes('undefined')) {
        logger.warn('Face detection runtime error detected, disabling face detection for this session')
        this.faceDetectionAvailable = false
        this.faceDetector = null
      } else {
        logger.warn('Face detection failed:', error.message)
      }
      return []
    }
  }

  /**
   * Convert face detection results to smartcrop boost regions
   * @param {Array} faces - Array of detected faces
   * @param {number} imageWidth - Original image width
   * @param {number} imageHeight - Original image height
   * @returns {Array} Array of boost regions for smartcrop
   */
  facesToBoostRegions(faces, imageWidth, imageHeight) {
    return faces.map(face => {
      const box = face.box
      // Add some padding around the face for better cropping
      const padding = Math.min(box.width, box.height) * 0.2
      return {
        x: Math.max(0, Math.round(box.xMin - padding)),
        y: Math.max(0, Math.round(box.yMin - padding)),
        width: Math.min(imageWidth - Math.round(box.xMin - padding), Math.round(box.width + 2 * padding)),
        height: Math.min(imageHeight - Math.round(box.yMin - padding), Math.round(box.height + 2 * padding)),
        weight: 1.0 // Maximum weight for faces
      }
    })
  }

  /**
   * Perform smart cropping on an image buffer
   * @param {Buffer} imageBuffer - The image buffer to crop
   * @param {string} targetSize - Target size in format "WIDTHxHEIGHT"
   * @param {Object} [options] - Additional options
   * @param {boolean} [options.detectFaces=true] - Whether to detect faces
   * @param {boolean} [options.objectDetection=false] - Whether to detect objects
   * @param {boolean} [options.faceOnly=false] - Whether to crop only around faces
   * @param {number} [options.facePadding=10] - Padding in pixels around faces when using faceOnly mode
   * @param {number} [options.minScale=1.0] - Minimum scale factor
   * @returns {Promise<Object>} Crop result with x, y, width, height
   */
  async smartCrop(imageBuffer, targetSize, options = {}) {
    const opts = {
      detectFaces: true,
      objectDetection: false,
      minScale: 1.0,
      faceOnly: false,
      facePadding: 10,
      ...options
    }
    try {
      // Parse target size
      const [targetWidth, targetHeight] = targetSize.split('x').map(Number)
      if (!targetWidth || !targetHeight) {
        throw new Error('Invalid target size format. Use "WIDTHxHEIGHT"')
      }
      // Load image to get dimensions
      const image = await loadImage(imageBuffer)
      // SmartCrop models should already be initialized during CMS bootstrap
      // If not initialized, it means smart cropping is disabled
      // Check if face-only cropping is explicitly requested
      if (opts.faceOnly) {
        if (this.faceDetectionAvailable) {
          const faces = await this.detectFaces(imageBuffer)
          if (faces.length > 0) {
            logger.info(`Creating face-only crop from ${faces.length} detected face(s)`)
            return this.cropFaceOnly(faces, image.width, image.height, targetWidth, targetHeight, opts.facePadding)
          }
        }
      }
      // Check if object detection is explicitly requested
      if (opts.objectDetection) {
        if (this.objectDetectionAvailable) {
          const objects = await this.detectObjects(imageBuffer)
          if (objects.length > 0) {
            logger.info(`Creating object-focused crop from ${objects.length} detected object(s)`)
            return this.cropAroundObjects(objects, image.width, image.height, targetWidth, targetHeight)
          }
        }
      }
      // Default smart crop behavior: Try object detection first to find people
      if (this.objectDetectionAvailable) {
        const objects = await this.detectObjects(imageBuffer)
        if (objects.length > 0) {
          // Filter for people objects
          const people = objects.filter(obj => obj.class === 'person')
          if (people.length > 1) {
            // Multiple people detected - crop around all people
            logger.info(`Creating crop around ${people.length} detected people`)
            return this.cropAroundMultiplePeople(people, image.width, image.height, targetWidth, targetHeight)
          } else if (people.length === 1) {
            // Single person detected - crop around person object unless faceOnly is requested
            if (opts.faceOnly) {
              // Use face detection for precise face cropping
              if (this.faceDetectionAvailable) {
                const faces = await this.detectFaces(imageBuffer)
                if (faces.length > 0) {
                  logger.info(`Creating face-only crop from ${faces.length} detected face(s) (single person detected)`)
                  return this.cropFaceOnly(faces, image.width, image.height, targetWidth, targetHeight, opts.facePadding)
                }
              }
              // Fall back to cropping around the person if face detection fails
              logger.info('Face detection failed for single person, cropping around person object')
              return this.cropAroundObjects(people, image.width, image.height, targetWidth, targetHeight)
            } else {
              // Crop around the detected person object
              logger.info('Creating crop around single detected person')
              return this.cropAroundObjects(people, image.width, image.height, targetWidth, targetHeight)
            }
          } else {
            // No people detected - crop around any detected objects
            logger.info(`No people detected, creating crop around ${objects.length} detected object(s)`)
            return this.cropAroundObjects(objects, image.width, image.height, targetWidth, targetHeight)
          }
        }
      }
      // Try face detection for single person or if object detection failed
      if (opts.detectFaces && this.faceDetectionAvailable) {
        const faces = await this.detectFaces(imageBuffer)
        if (faces.length > 0) {
          logger.info(`Using ${faces.length} face(s) to guide smart cropping`)
          return this.cropAroundFaces(faces, image.width, image.height, targetWidth, targetHeight)
        }
      }
      // No people, objects, or faces detected - use center crop
      logger.info('Using intelligent center crop algorithm')
      return this.calculateCenterCrop(image.width, image.height, targetWidth, targetHeight)
    } catch (error) {
      logger.error('Smart crop failed:', error)
      throw error
    }
  }

  /**
   * Create a crop around detected objects
   * @param {Array} objects - Array of object detection results
   * @param {number} imageWidth - Original image width
   * @param {number} imageHeight - Original image height
   * @param {number} targetWidth - Target width for cropping
   * @param {number} targetHeight - Target height for cropping
   * @returns {Object} Crop coordinates for object-focused crop
   */
  cropAroundObjects(objects, imageWidth, imageHeight, targetWidth, targetHeight) {
    if (objects.length === 0) {
      logger.warn('No objects detected for object-focused crop, falling back to center crop')
      return this.calculateCenterCrop(imageWidth, imageHeight, targetWidth, targetHeight)
    }
    // Find the bounding box that contains all objects (or use the highest confidence object)
    const primaryObject = objects.reduce((prev, current) =>
      prev.score > current.score ? prev : current
    )
    const [objX, objY, objWidth, objHeight] = primaryObject.bbox
    logger.info(`Primary object: ${primaryObject.class} (confidence: ${primaryObject.score.toFixed(3)})`)
    logger.info(`Object bbox: x=${Math.round(objX)}, y=${Math.round(objY)}, width=${Math.round(objWidth)}, height=${Math.round(objHeight)}`)
    // Add padding around the object (30% of object size)
    const padding = Math.max(objWidth, objHeight) * 0.3
    // Calculate the object center
    const objCenterX = objX + objWidth / 2
    const objCenterY = objY + objHeight / 2
    // Create crop area maintaining target aspect ratio
    const targetRatio = targetWidth / targetHeight
    let cropDimension = Math.max(objWidth, objHeight) + padding
    // Adjust for target aspect ratio
    let cropWidth, cropHeight
    if (Math.abs(targetRatio - 1) < 0.1) { // Square target
      cropWidth = cropHeight = cropDimension
    } else {
      if (targetRatio > 1) {
        // Landscape
        cropWidth = cropDimension
        cropHeight = cropDimension / targetRatio
      } else {
        // Portrait
        cropHeight = cropDimension
        cropWidth = cropDimension * targetRatio
      }
    }
    // Center the crop around the object
    let cropX = objCenterX - cropWidth / 2
    let cropY = objCenterY - cropHeight / 2
    // Ensure crop stays within image bounds
    if (cropX < 0) {
      cropX = 0
    } else if (cropX + cropWidth > imageWidth) {
      cropX = imageWidth - cropWidth
    }
    if (cropY < 0) {
      cropY = 0
    } else if (cropY + cropHeight > imageHeight) {
      cropY = imageHeight - cropHeight
    }
    // If the crop is still too big for the image, scale it down
    if (cropWidth > imageWidth) {
      const scale = imageWidth / cropWidth
      cropWidth = imageWidth
      cropHeight = cropHeight * scale
      cropX = 0
      cropY = Math.max(0, objCenterY - cropHeight / 2)
    }
    if (cropHeight > imageHeight) {
      const scale = imageHeight / cropHeight
      cropHeight = imageHeight
      cropWidth = cropWidth * scale
      cropY = 0
      cropX = Math.max(0, objCenterX - cropWidth / 2)
    }
    // Final validation
    cropX = Math.max(0, Math.min(cropX, imageWidth - 1))
    cropY = Math.max(0, Math.min(cropY, imageHeight - 1))
    cropWidth = Math.max(1, Math.min(cropWidth, imageWidth - cropX))
    cropHeight = Math.max(1, Math.min(cropHeight, imageHeight - cropY))
    logger.info(`Object-focused crop: ${Math.round(cropWidth)}x${Math.round(cropHeight)} at (${Math.round(cropX)}, ${Math.round(cropY)})`)
    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      objectsDetected: objects.length,
      primaryObject: {
        class: primaryObject.class,
        score: primaryObject.score
      }
    }
  }

  /**
   * Create a crop around multiple detected people
   * @param {Array} people - Array of person detection results
   * @param {number} imageWidth - Original image width
   * @param {number} imageHeight - Original image height
   * @param {number} targetWidth - Target width for cropping
   * @param {number} targetHeight - Target height for cropping
   * @returns {Object} Crop coordinates for multiple people crop
   */
  cropAroundMultiplePeople(people, imageWidth, imageHeight, targetWidth, targetHeight) {
    if (people.length === 0) {
      logger.warn('No people detected for multiple people crop, falling back to center crop')
      return this.calculateCenterCrop(imageWidth, imageHeight, targetWidth, targetHeight)
    }
    // Find the bounding box that contains all people
    let minX = imageWidth
    let minY = imageHeight
    let maxX = 0
    let maxY = 0
    people.forEach(person => {
      const [x, y, width, height] = person.bbox
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + width)
      maxY = Math.max(maxY, y + height)
    })
    logger.info(`People bounding box: x=${Math.round(minX)}, y=${Math.round(minY)}, width=${Math.round(maxX - minX)}, height=${Math.round(maxY - minY)}`)
    // Add padding around the people group (20% of group size)
    const groupWidth = maxX - minX
    const groupHeight = maxY - minY
    const padding = Math.max(groupWidth, groupHeight) * 0.2
    // Calculate the group center
    const groupCenterX = (minX + maxX) / 2
    const groupCenterY = (minY + maxY) / 2
    // Create crop area maintaining target aspect ratio
    const targetRatio = targetWidth / targetHeight
    let cropDimension = Math.max(groupWidth, groupHeight) + padding
    // Adjust for target aspect ratio
    let cropWidth, cropHeight
    if (Math.abs(targetRatio - 1) < 0.1) { // Square target
      cropWidth = cropHeight = cropDimension
    } else {
      if (targetRatio > 1) {
        // Landscape
        cropWidth = cropDimension
        cropHeight = cropDimension / targetRatio
      } else {
        // Portrait
        cropHeight = cropDimension
        cropWidth = cropDimension * targetRatio
      }
    }
    // Center the crop around the group
    let cropX = groupCenterX - cropWidth / 2
    let cropY = groupCenterY - cropHeight / 2
    // Ensure crop stays within image bounds
    if (cropX < 0) {
      cropX = 0
    } else if (cropX + cropWidth > imageWidth) {
      cropX = imageWidth - cropWidth
    }
    if (cropY < 0) {
      cropY = 0
    } else if (cropY + cropHeight > imageHeight) {
      cropY = imageHeight - cropHeight
    }
    // If the crop is still too big for the image, scale it down
    if (cropWidth > imageWidth) {
      const scale = imageWidth / cropWidth
      cropWidth = imageWidth
      cropHeight = cropHeight * scale
      cropX = 0
      cropY = Math.max(0, groupCenterY - cropHeight / 2)
    }
    if (cropHeight > imageHeight) {
      const scale = imageHeight / cropHeight
      cropHeight = imageHeight
      cropWidth = cropWidth * scale
      cropY = 0
      cropX = Math.max(0, groupCenterX - cropWidth / 2)
    }
    // Final validation
    cropX = Math.max(0, Math.min(cropX, imageWidth - 1))
    cropY = Math.max(0, Math.min(cropY, imageHeight - 1))
    cropWidth = Math.max(1, Math.min(cropWidth, imageWidth - cropX))
    cropHeight = Math.max(1, Math.min(cropHeight, imageHeight - cropY))
    logger.info(`Multiple people crop: ${Math.round(cropWidth)}x${Math.round(cropHeight)} at (${Math.round(cropX)}, ${Math.round(cropY)})`)
    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      peopleDetected: people.length,
      cropType: 'multiple-people'
    }
  }

  /**
   * Apply smart crop to an image buffer using sharp
   * @param {Buffer} imageBuffer - The image buffer to crop
   * @param {string} targetSize - Target size in format "WIDTHxHEIGHT"
   * @param {Object} [options] - Additional options
   * @returns {Promise<Object>} Object with cropped image buffer and metadata
   */
  async applyCrop(imageBuffer, targetSize, options = {}) {
    try {
      // Get crop coordinates using smart crop
      const cropResult = await this.smartCrop(imageBuffer, targetSize, options)
      const [targetWidth, targetHeight] = targetSize.split('x').map(Number)
      // Get original format and size
      const metadata = await sharp(imageBuffer).metadata()
      const format = metadata.format || 'jpeg'
      // Crop and resize using sharp
      let image = sharp(imageBuffer)
      image = image.extract({
        left: Math.round(cropResult.x),
        top: Math.round(cropResult.y),
        width: Math.round(cropResult.width),
        height: Math.round(cropResult.height)
      })
      image = image.resize(targetWidth, targetHeight)
      image = image.toFormat(format)
      const buffer = await image.toBuffer()
      return {
        buffer,
        mimeType: metadata.format ? `image/${metadata.format}` : 'image/jpeg',
        contentLength: buffer.length,
        cropResult,
        originalSize: {
          width: metadata.width,
          height: metadata.height
        },
        targetSize: { width: targetWidth, height: targetHeight }
      }
    } catch (error) {
      logger.error('Smart crop failed, falling back to center crop:', error)
      // Fallback to simple center crop using sharp
      try {
        const metadata = await sharp(imageBuffer).metadata()
        const imageWidth = metadata.width
        const imageHeight = metadata.height
        const format = metadata.format || 'jpeg'
        const [targetWidth, targetHeight] = targetSize.split('x').map(Number)
        // Calculate center crop dimensions
        const sourceRatio = imageWidth / imageHeight
        const targetRatio = targetWidth / targetHeight
        let cropWidth = imageWidth
        let cropHeight = imageHeight
        let cropX = 0
        let cropY = 0
        if (sourceRatio > targetRatio) {
          // Source is wider than target - crop width
          cropWidth = imageHeight * targetRatio
          cropX = (imageWidth - cropWidth) / 2
        } else {
          // Source is taller than target - crop height
          cropHeight = imageWidth / targetRatio
          cropY = (imageHeight - cropHeight) / 2
        }
        // Crop and resize using sharp
        let image = sharp(imageBuffer)
        image = image.extract({
          left: Math.round(cropX),
          top: Math.round(cropY),
          width: Math.round(cropWidth),
          height: Math.round(cropHeight)
        })
        image = image.resize(targetWidth, targetHeight)
        image = image.toFormat(format)
        const buffer = await image.toBuffer()
        logger.info(`Applied fallback center crop: ${Math.round(cropWidth)}x${Math.round(cropHeight)} at (${Math.round(cropX)}, ${Math.round(cropY)})`)
        return {
          buffer,
          mimeType: metadata.format ? `image/${metadata.format}` : 'image/jpeg',
          contentLength: buffer.length,
          cropResult: {
            x: Math.round(cropX),
            y: Math.round(cropY),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight),
            facesDetected: 0
          },
          originalSize: { width: imageWidth, height: imageHeight },
          targetSize: { width: targetWidth, height: targetHeight },
          fallback: true
        }
      } catch (fallbackError) {
        logger.error('Fallback center crop also failed:', fallbackError)
        throw new Error(`All cropping methods failed: ${error.message}`)
      }
    }
  }

  /**
   * Create a more efficient image processing method that reuses canvas
   * @param {Buffer} imageBuffer - The image buffer
   * @returns {Promise<{canvas: Canvas, image: Image}>} Canvas and image objects for reuse
   */
  async prepareImageForDetection(imageBuffer) {
    // Load image once and reuse for both face and object detection
    const image = await loadImage(imageBuffer)
    const canvas = createCanvas(image.width, image.height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    return { canvas, image }
  }

  /**
   * Detect both faces and objects efficiently using shared canvas
   * @param {Buffer} imageBuffer - The image buffer
   * @returns {Promise<{faces: Array, objects: Array}>} Combined detection results
   */
  async detectBothFacesAndObjects(imageBuffer) {
    if (!this.faceDetectionAvailable && !this.objectDetectionAvailable) {
      return { faces: [], objects: [] }
    }
    try {
      // Prepare image once for both detections
      const { canvas } = await this.prepareImageForDetection(imageBuffer)
      // Run both detections on the same canvas
      const [faces, objects] = await Promise.all([
        this.faceDetectionAvailable ? this.faceDetector.estimateFaces(canvas) : [],
        this.objectDetectionAvailable ? this.objectDetector.detect(canvas) : []
      ])
      logger.info(`Detected ${faces.length} face(s) and ${objects.length} object(s) in one pass`)
      return { faces, objects }
    } catch (error) {
      logger.warn('Combined detection failed:', error.message)
      return { faces: [], objects: [] }
    }
  }

  /**
   * Calculate crop coordinates based on detected faces
   * @param {Array} faces - Array of face detection results
   * @param {number} imageWidth - Original image width
   * @param {number} imageHeight - Original image height
   * @param {number} targetWidth - Target width for cropping
   * @param {number} targetHeight - Target height for cropping
   * @returns {Object} Crop coordinates
   */
  cropAroundFaces(faces, imageWidth, imageHeight, targetWidth, targetHeight) {
    // Find the bounding box that contains all faces
    let minX = imageWidth
    let minY = imageHeight
    let maxX = 0
    let maxY = 0
    faces.forEach(face => {
      const box = face.box
      minX = Math.min(minX, box.xMin * imageWidth)
      minY = Math.min(minY, box.yMin * imageHeight)
      maxX = Math.max(maxX, box.xMax * imageWidth)
      maxY = Math.max(maxY, box.yMax * imageHeight)
    })
    // Add padding around faces (20% of face area)
    const faceWidth = maxX - minX
    const faceHeight = maxY - minY
    const padding = Math.max(faceWidth, faceHeight) * 0.2
    minX = Math.max(0, minX - padding)
    minY = Math.max(0, minY - padding)
    maxX = Math.min(imageWidth, maxX + padding)
    maxY = Math.min(imageHeight, maxY + padding)
    // Calculate crop area maintaining target aspect ratio
    const targetRatio = targetWidth / targetHeight
    const facesCenterX = (minX + maxX) / 2
    const facesCenterY = (minY + maxY) / 2
    // Calculate optimal crop size based on target ratio
    let cropWidth = maxX - minX
    let cropHeight = maxY - minY
    if (cropWidth / cropHeight > targetRatio) {
      // Adjust height to match ratio
      cropHeight = cropWidth / targetRatio
    } else {
      // Adjust width to match ratio
      cropWidth = cropHeight * targetRatio
    }
    // Center the crop around faces
    let cropX = facesCenterX - cropWidth / 2
    let cropY = facesCenterY - cropHeight / 2
    // Ensure crop stays within image bounds
    if (cropX < 0) cropX = 0
    if (cropY < 0) cropY = 0
    if (cropX + cropWidth > imageWidth) cropX = imageWidth - cropWidth
    if (cropY + cropHeight > imageHeight) cropY = imageHeight - cropHeight
    // Final validation to ensure all values are positive and within bounds
    cropX = Math.max(0, Math.min(cropX, imageWidth - 1))
    cropY = Math.max(0, Math.min(cropY, imageHeight - 1))
    cropWidth = Math.max(1, Math.min(cropWidth, imageWidth - cropX))
    cropHeight = Math.max(1, Math.min(cropHeight, imageHeight - cropY))
    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      facesDetected: faces.length
    }
  }

  /**
   * Calculate center crop coordinates
   * @param {number} imageWidth - Original image width
   * @param {number} imageHeight - Original image height
   * @param {number} targetWidth - Target width for cropping
   * @param {number} targetHeight - Target height for cropping
   * @returns {Object} Crop coordinates
   */
  calculateCenterCrop(imageWidth, imageHeight, targetWidth, targetHeight) {
    const sourceRatio = imageWidth / imageHeight
    const targetRatio = targetWidth / targetHeight
    let cropWidth = imageWidth
    let cropHeight = imageHeight
    let cropX = 0
    let cropY = 0
    if (sourceRatio > targetRatio) {
      // Source is wider than target - crop width
      cropWidth = imageHeight * targetRatio
      cropX = (imageWidth - cropWidth) / 2
    } else {
      // Source is taller than target - crop height
      cropHeight = imageWidth / targetRatio
      cropY = (imageHeight - cropHeight) / 2
    }
    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      facesDetected: 0
    }
  }

  /**
   * Create a tight face-only crop from detected faces
   * @param {Array} faces - Array of face detection results
   * @param {number} imageWidth - Original image width
   * @param {number} imageHeight - Original image height
   * @param {number} targetWidth - Target width for cropping
   * @param {number} targetHeight - Target height for cropping
   * @param {number} [facePadding=10] - Padding in pixels around the face
   * @returns {Object} Crop coordinates for face-only crop
   */
  cropFaceOnly(faces, imageWidth, imageHeight, targetWidth, targetHeight, facePadding = 10) {
    if (faces.length === 0) {
      logger.warn('No faces detected for face-only crop, falling back to center crop')
      return this.calculateCenterCrop(imageWidth, imageHeight, targetWidth, targetHeight)
    }
    // Use the first (largest) face for face-only cropping
    const face = faces[0]
    const box = face.box
    // Face detection coordinates might be in different formats
    // Check if coordinates are normalized (0-1) or pixel values
    let faceX, faceY, faceWidth, faceHeight
    if (box.xMax <= 1 && box.yMax <= 1) {
      // Normalized coordinates (0-1)
      faceX = box.xMin * imageWidth
      faceY = box.yMin * imageHeight
      faceWidth = (box.xMax - box.xMin) * imageWidth
      faceHeight = (box.yMax - box.yMin) * imageHeight
    } else {
      // Already pixel coordinates
      faceX = box.xMin
      faceY = box.yMin
      faceWidth = box.width || (box.xMax - box.xMin)
      faceHeight = box.height || (box.yMax - box.yMin)
    }
    logger.info(`Detected face at: x=${Math.round(faceX)}, y=${Math.round(faceY)}, width=${Math.round(faceWidth)}, height=${Math.round(faceHeight)}`)
    logger.info(`Image dimensions: ${imageWidth}x${imageHeight}`)
    // For face-only cropping, add specified padding around the face bounding box
    const padding = facePadding

    // Calculate crop area with custom padding around the face
    let cropX = faceX - padding
    let cropY = faceY - padding
    let cropWidth = faceWidth + (padding * 2)
    let cropHeight = faceHeight + (padding * 2)

    // Make the crop square to prevent face squashing when resizing
    // Use the larger dimension to ensure the entire face fits
    const cropSize = Math.max(cropWidth, cropHeight)

    // Center the square crop on the face
    const faceCenterX = faceX + faceWidth / 2
    const faceCenterY = faceY + faceHeight / 2

    cropX = faceCenterX - cropSize / 2
    cropY = faceCenterY - cropSize / 2
    cropWidth = cropSize
    cropHeight = cropSize

    logger.info(`Square crop with ${padding}px face padding: ${Math.round(cropSize)}x${Math.round(cropSize)} at (${Math.round(cropX)}, ${Math.round(cropY)})`)
    // Ensure crop stays within image bounds
    if (cropX < 0) {
      cropX = 0
    } else if (cropX + cropWidth > imageWidth) {
      cropX = imageWidth - cropWidth
    }
    if (cropY < 0) {
      cropY = 0
    } else if (cropY + cropHeight > imageHeight) {
      cropY = imageHeight - cropHeight
    }
    // If the crop is still too big for the image, scale it down
    if (cropWidth > imageWidth) {
      const scale = imageWidth / cropWidth
      cropWidth = imageWidth
      cropHeight = cropHeight * scale
      cropX = 0
      // Recalculate Y to keep face centered vertically
      const faceCenterY = faceY + faceHeight / 2
      cropY = Math.max(0, faceCenterY - cropHeight / 2)
    }
    if (cropHeight > imageHeight) {
      const scale = imageHeight / cropHeight
      cropHeight = imageHeight
      cropWidth = cropWidth * scale
      cropY = 0
      // Recalculate X to keep face centered horizontally
      const faceCenterX = faceX + faceWidth / 2
      cropX = Math.max(0, faceCenterX - cropWidth / 2)
    }
    // Final validation
    cropX = Math.max(0, Math.min(cropX, imageWidth - 1))
    cropY = Math.max(0, Math.min(cropY, imageHeight - 1))
    cropWidth = Math.max(1, Math.min(cropWidth, imageWidth - cropX))
    cropHeight = Math.max(1, Math.min(cropHeight, imageHeight - cropY))
    logger.info(`Final face-only crop (square): ${Math.round(cropWidth)}x${Math.round(cropHeight)} at (${Math.round(cropX)}, ${Math.round(cropY)})`)
    return {
      x: Math.round(cropX),
      y: Math.round(cropY),
      width: Math.round(cropWidth),
      height: Math.round(cropHeight),
      facesDetected: faces.length,
      faceOnly: true,
      padding: facePadding
    }
  }
}

// Export singleton instance
module.exports = new SmartCrop()
