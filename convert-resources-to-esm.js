#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'

const resourcesDir = 'resources'

async function convertResourceFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8')

    // Replace CommonJS export patterns with ESM
    if (content.includes('exports = (module.exports = {')) {
      content = content.replace('exports = (module.exports = {', 'export default {')
      content = content.replace(/\)\s*$/, '')
    } else if (content.includes('exports = module.exports = {')) {
      content = content.replace('exports = module.exports = {', 'export default {')
    } else if (content.includes('module.exports = {')) {
      content = content.replace('module.exports = {', 'export default {')
    }

    await fs.writeFile(filePath, content)
    console.log(`✅ Converted ${filePath}`)
  } catch (error) {
    console.error(`❌ Failed to convert ${filePath}:`, error.message)
  }
}

async function convertAllResources() {
  const files = await fs.readdir(resourcesDir)

  for (const file of files) {
    if (file.endsWith('.js')) {
      const filePath = path.join(resourcesDir, file)
      await convertResourceFile(filePath)
    }
  }

  // Also convert paragraph files
  const paragraphsDir = path.join(resourcesDir, 'paragraphs')
  if (await fs.pathExists(paragraphsDir)) {
    const paragraphFiles = await fs.readdir(paragraphsDir)
    for (const file of paragraphFiles) {
      if (file.endsWith('.js')) {
        const filePath = path.join(paragraphsDir, file)
        await convertResourceFile(filePath)
      }
    }
  }
}

convertAllResources().catch(console.error)
