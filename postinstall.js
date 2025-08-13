const os = require('os')
if (os.platform() !== 'win32') {
  return
}
const fs = require('fs')
const path = require('path')
const destDir = path.join(__dirname, 'node_modules', '@tensorflow', 'tfjs-node', 'lib', 'napi-v8')
const dest = path.join(destDir, 'tensorflow.dll')
if (fs.existsSync(dest)) {
  return console.log('tensorflow.dll already exists at destination, skipping copy.')
}
const src = path.join(__dirname, 'node_modules', '@tensorflow', 'tfjs-node', 'deps', 'lib', 'tensorflow.dll')
if (!fs.existsSync(src)) {
  return console.warn('tensorflow.dll not found at', src)
}
try {
  fs.copyFileSync(src, dest)
  console.log('Copied tensorflow.dll to napi-v8 directory for Windows tfjs-node compatibility.')
} catch (err) {
  console.error('Failed to copy tensorflow.dll:', err)
}
