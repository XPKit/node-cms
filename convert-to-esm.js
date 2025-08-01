#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const __filename = import.meta.filename
const __dirname = import.meta.dirname

// Files to convert
const filesToConvert = [
  'lib/helpers.js',
  'lib/SyslogManager.js',
  'lib/SystemManager.js',
  'lib/UpdatesManager.js',
  'lib/ResourceAPIWrapper.js',
  'lib/util/imageOptimization.js',
  'lib/util/smartcrop.js',
  'lib/util/driver/index.js',
  'lib/db/json_store.js',
  'lib/db/file_store.js'
]

// Basic conversion patterns
const conversions = [
  // Convert require statements to import statements
  {
    pattern: /const (\w+) = require\('([^']+)'\)/g,
    replacement: 'import $1 from \'$2\''
  },
  {
    pattern: /const { ([^}]+) } = require\('([^']+)'\)/g,
    replacement: 'import { $1 } from \'$2\''
  },
  // Convert local requires to include .js extension
  {
    pattern: /from '(\.\.[^']*)'(?!\.js)/g,
    replacement: 'from \'$1.js\''
  },
  {
    pattern: /from '(\.[^']*)'(?!\.js|\.json)/g,
    replacement: 'from \'$1.js\''
  },
  // Convert module.exports
  {
    pattern: /exports = module\.exports = (\w+)/g,
    replacement: 'export default $1'
  },
  {
    pattern: /module\.exports = (\w+)/g,
    replacement: 'export default $1'
  }
]

function convertFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')

    // Apply conversions
    conversions.forEach(({ pattern, replacement }) => {
      content = content.replace(pattern, replacement)
    })

    // Special handling for img-sh-logger constructor pattern
    content = content.replace(
      /const logger = new \(require\('img-sh-logger'\)\)\(\)/g,
      'import Logger from \'img-sh-logger\'\nconst logger = new Logger()'
    )

    fs.writeFileSync(filePath, content)
    console.log(`✅ Converted: ${filePath}`)
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message)
  }
}

// Convert all files
filesToConvert.forEach(file => {
  const fullPath = path.join(__dirname, file)
  if (fs.existsSync(fullPath)) {
    convertFile(fullPath)
  } else {
    console.warn(`⚠️  File not found: ${fullPath}`)
  }
})

console.log('Conversion completed!')
