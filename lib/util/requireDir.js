import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

/**
 * ESM-compatible replacement for require-dir
 * Dynamically imports all modules from a directory
 * @param {string} dirPath - Path to the directory to import from
 * @param {Object} options - Options for import behavior
 * @param {boolean} options.recursive - Whether to import recursively (default: false)
 * @param {Array<string>} options.extensions - File extensions to include (default: ['.js', '.mjs'])
 * @returns {Promise<Object>} Object with filename keys and module values
 */
export default async function requireDir(dirPath, options = {}) {
  const {
    recursive = false,
    extensions = ['.js', '.mjs']
  } = options

  // Convert relative paths to absolute paths
  let absolutePath
  if (path.isAbsolute(dirPath)) {
    absolutePath = dirPath
  } else {
    // Get the directory of the calling module using import.meta.url
    const currentFile = fileURLToPath(import.meta.url)
    const currentDir = path.dirname(currentFile)
    absolutePath = path.resolve(currentDir, '..', '..', dirPath)
  }
  const result = {}
  try {
    const entries = await fs.readdir(absolutePath, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(absolutePath, entry.name)
      if (entry.isDirectory() && recursive) {
        // Recursively import from subdirectories
        const subResult = await requireDir(fullPath, options)
        result[entry.name] = subResult
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (extensions.includes(ext)) {
          try {
            // Use file:// URL for dynamic import to ensure cross-platform compatibility
            const fileUrl = `file://${fullPath.replace(/\\/g, '/')}`
            const module = await import(fileUrl)
            // Get filename without extension as key
            const key = path.basename(entry.name, ext)
            // Extract default export if available, otherwise use entire module
            result[key] = module.default || module
          } catch (importError) {
            console.warn(`Failed to import ${fullPath}:`, importError.message)
          }
        }
      }
    }
  } catch (error) {
    console.error(`Failed to read directory ${absolutePath}:`, error.message)
    throw error
  }

  return result
}
