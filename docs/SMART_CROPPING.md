# Smart Cropping Feature

## Overview

The smart cropping feature provides AI-powered intelligent image cropping with automatic face detection and object detection. It uses TensorFlow.js with BlazeFace and COCO-SSD models to create optimal crops that preserve important visual elements, especially faces and objects.

## Installation

The following npm packages are required for smart cropping:

```bash
npm install @tensorflow-models/blazeface @tensorflow-models/coco-ssd @tensorflow/tfjs-node canvas
```

## Configuration

Smart cropping must be enabled in the CMS configuration:

```javascript
const cms = new CMS({
  data: './data',
  locales: ['enUS'],
  smartCrop: true  // Enable smart cropping functionality
})
```

## Usage

### Basic Smart Cropping

To use smart cropping with the CMS attachment API, add the `smart: true` option:

```javascript
// Get an attachment with smart cropping
const attachment = await api('articles').findAttachment('article-id', 'attachment-id', {
  resize: '400x300',
  smart: true
})
```

### Advanced Options

```javascript
// Face-only cropping with default padding (10px)
const faceOnlyAttachment = await api('articles').findAttachment('article-id', 'attachment-id', {
  resize: '100x100',
  smart: true,
  faceOnly: true
})

// Face-only cropping with custom padding
const tightFaceAttachment = await api('articles').findAttachment('article-id', 'attachment-id', {
  resize: '100x100',
  smart: true,
  faceOnly: true,
  facePadding: 5  // 5px padding for tighter crop
})

const looseFaceAttachment = await api('articles').findAttachment('article-id', 'attachment-id', {
  resize: '100x100',
  smart: true,
  faceOnly: true,
  facePadding: 20  // 20px padding for looser crop
})

// Extreme tight crop with no padding
const noFacePadding = await api('articles').findAttachment('article-id', 'attachment-id', {
  resize: '100x100',
  smart: true,
  faceOnly: true,
  facePadding: 0  // 0px padding - crops exactly around the face
})

// Object detection focused cropping
const objectFocusedAttachment = await api('articles').findAttachment('article-id', 'attachment-id', {
  resize: '100x100',
  smart: true,
  objectDetection: true
})
```

### API Parameters

- **`resize`**: Target dimensions in format `"WIDTHxHEIGHT"` (required)
- **`smart`**: Boolean flag to enable smart cropping (default: false)
- **`faceOnly`**: Boolean flag to crop tightly around faces only (default: false)
- **`facePadding`**: Padding around faces in pixels when using faceOnly mode (default: 10)
- **`objectDetection`**: Boolean flag to prioritize object detection over default logic (default: false)

## How It Works

The smart cropping system uses a hierarchical detection approach:

1. **AI Model Initialization**: BlazeFace for face detection and COCO-SSD for object detection
2. **Hierarchical Detection Logic**:
   - **Multiple People**: Crops around all detected people
   - **Single Person**: Crops around the person (or face if `faceOnly: true`)
   - **Objects Only**: Crops around detected objects
   - **No Detection**: Falls back to center crop
3. **Smart Crop Generation**: Creates optimal crop preserving important elements
4. **Caching**: Results are cached for performance with smart-specific cache keys

### Face Detection Details

- **Model**: BlazeFace (TensorFlow.js standalone model)
- **Features**: Detects face bounding boxes with confidence scores
- **Face-Only Mode**: Creates square crops with customizable padding around faces (default: 10px)
- **Custom Padding**: Use `facePadding` parameter to adjust space around faces (e.g., 5px for tight crops, 20px for loose crops)
- **Aspect Ratio**: Automatically maintains face proportions to prevent squashing

### Object Detection Details

- **Model**: COCO-SSD (Common Objects in Context)
- **Objects**: Detects 80+ object classes including person, laptop, car, etc.
- **Priority**: Higher confidence objects take precedence
- **Person Detection**: People are prioritized over other objects

### Performance

- **Initialization**: Models load during CMS bootstrap (not first use)
- **Caching**: Smart cropped images cached with prefix `{attachment-id}-smart-{mode}-{size}`
- **Fallback**: Graceful degradation to center crop if AI models fail
- **Memory**: ~100MB for TensorFlow.js models
- **Speed**:
  - Cold start: ~2-3 seconds (model loading)
  - Warm execution: ~150-200ms per image
  - Cache hit: ~50ms

## Example Results

### Face-Only Cropping (`faceOnly: true`)
- Creates tight 100x100 square crops around detected faces
- Adds exactly 10px padding around face bounding box
- Prevents face squashing by using square crop areas
- Perfect for avatars and profile pictures

### Smart Object Detection (`objectDetection: true`)
- Prioritizes detected objects (people, laptops, etc.)
- Uses confidence scores to select primary object
- Creates crops focused on the most important detected element

### Default Smart Mode (`smart: true`)
- Uses hierarchical logic: people → objects → center crop
- Balances multiple elements when present
- Adapts to image content automatically

## Cache Management

Smart cropped images use specific cache keys:
- `{attachment-id}-smart-default-{dimensions}` - Default smart crop
- `{attachment-id}-smart-faceonly-{dimensions}` - Face-only crop
- `{attachment-id}-smart-objects-{dimensions}` - Object detection crop

Cache is automatically cleaned up when:
- The original attachment is deleted
- The attachment is updated
- The parent record is removed

## Error Handling & Fallbacks

The system includes comprehensive error handling:

1. **Face Detection Failure**: Falls back to object detection
2. **Object Detection Failure**: Falls back to center crop
3. **Model Load Failure**: Disables AI features, continues with basic cropping
4. **Runtime Errors**: Logged with detailed error information
5. **Graceful Degradation**: Always produces a valid crop result

## Debugging

Smart cropping includes detailed logging:

```
Smart cropping enabled - loading TensorFlow.js Node backend...
BlazeFace model loaded successfully
Face detection model initialized successfully
Object detection model initialized successfully
Detected 1 face(s)
Square crop with face centered: 138x138 at (393, 45)
Smart crop completed: 612x408 -> 100x100
```

## Configuration Options

The smart cropping behavior can be customized in CMS configuration:

```javascript
const cms = new CMS({
  data: './data',
  locales: ['enUS'],
  smartCrop: true,  // Enable/disable smart cropping
  // Other CMS options...
})
```

## Frontend Integration

### Direct URL Usage
```javascript
// Smart cropped thumbnail
const imageUrl = `/api/articles/${articleId}/attachments/${attachmentId}?resize=400x300&smart=true`

// Face-only avatar
const avatarUrl = `/api/users/${userId}/attachments/${attachmentId}?resize=100x100&smart=true&faceOnly=true`
```

### JavaScript/React Example
```javascript
const response = await fetch(`/api/articles/${articleId}/attachments/${attachmentId}`, {
  method: 'GET',
  headers: {
    'Accept': 'image/*'
  },
  query: new URLSearchParams({
    resize: '400x300',
    smart: 'true',
    faceOnly: 'true'
  })
})
```

## Testing

A comprehensive test suite is available:

```bash
# Run smart cropping tests
node test-smart-cropping.js
```

Test files are organized in the `test/` folder:
- `test/man.jpg` - Source test image
- `test/man-*.jpg` - Generated test results (ignored by git)

## Technical Architecture

### Files
1. **`lib/util/smartcrop.js`** - Core smart cropping utility with AI models
2. **`lib/util/imagemin.js`** - Integration with image processing pipeline
3. **`lib/util/driver/index.js`** - Attachment API integration
4. **`index.js`** - CMS bootstrap integration for model initialization

### Dependencies
- **`@tensorflow-models/blazeface`** - Face detection model
- **`@tensorflow-models/coco-ssd`** - Object detection model
- **`@tensorflow/tfjs-node`** - TensorFlow.js Node.js backend
- **`canvas`** - HTML5 Canvas API for Node.js image processing

### Performance Characteristics
- **Model Loading**: During CMS startup (not lazy loaded)
- **Processing Speed**: ~150-200ms per image (after models loaded)
- **Memory Usage**: ~100MB for AI models (constant)
- **Cache Hit Rate**: Very high due to deterministic cache keys
- **Fallback Performance**: <50ms (center crop fallback)

## Benefits

✅ **AI-Powered**: Uses state-of-the-art face and object detection
✅ **Automatic**: No manual intervention required
✅ **Fast**: Optimized TensorFlow.js backend with caching
✅ **Reliable**: Comprehensive error handling and fallbacks
✅ **Flexible**: Multiple cropping modes for different use cases
✅ **Compatible**: Works with existing CMS attachment API
✅ **Cached**: High performance through intelligent caching

The smart cropping feature dramatically improves the quality of automatically generated thumbnails and crops by ensuring that faces and important content are preserved in the final result.
