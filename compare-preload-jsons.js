const fs = require('fs-extra')
const path = require('node:path')
const _ = require('lodash')

const preloadDir = path.resolve(__dirname, 'preloads')
const oldPreloadDir = path.resolve(__dirname, 'old_preloads')

const argFile = process.argv[2] ? process.argv[2].replace(/\\/g, '/') : null

class ComparePreloads {
  constructor(argFile) {
    argFile ? this.compareSingleFile(argFile) : this.compareAllFiles()
  }
  compareSingleFile(file) {
    const preloadFile = path.join(preloadDir, file)
    const oldPreloadFile = path.join(oldPreloadDir, file)
    if (!fs.existsSync(preloadFile)) {
      console.log(`File not found in preload: ${file}`)
      process.exit(1)
    } else if (!fs.existsSync(oldPreloadFile)) {
      console.log(`File not found in old_preload: ${file}`)
      process.exit(1)
    }
    const { isEqual, dataA, dataB } = this.compareJsonFiles(preloadFile, oldPreloadFile)
    if (isEqual) {
      return console.log(`MATCH: ${file}`)
    }
    console.log(`DIFFERENT: ${file}`)
    console.log(`\n--- DIFF for ${file} ---`)
    this.printDiff(dataA, dataB)
    console.log('--- END DIFF ---\n')
  }
  append(line) {
    this.diffOutput += `${line}\n`
  }
  listJsonFiles(dir) {
    const results = []
    function walk(current, relBase) {
      const entries = fs.readdirSync(current, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name)
        const relPath = path.join(relBase, entry.name)
        if (entry.isDirectory()) {
          walk(fullPath, relPath)
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
          results.push(relPath)
        }
      }
    }
    walk(dir, '')
    return results
  }
  compareJsonFiles(fileA, fileB) {
    try {
      const dataA = fs.readJsonSync(fileA)
      const dataB = fs.readJsonSync(fileB)
      dataB.version = dataA.version
      dataB.forced = dataA.forced
      return {
        isEqual: _.isEqual(dataA, dataB),
        dataA,
        dataB,
      }
    } catch (err) {
      console.error(`Error reading or parsing files: ${fileA}, ${fileB}`, err)
      return { isEqual: false, dataA: null, dataB: null }
    }
  }
  compareAllFiles() {
    const preloadFiles = this.listJsonFiles(preloadDir)
    const oldPreloadFiles = this.listJsonFiles(oldPreloadDir)
    const oldPreloadSet = new Set(oldPreloadFiles.map((f) => f.replace(/\\/g, '/')))
    const report = []
    let allMatch = true
    this.diffOutput = ''
    for (const relPath of preloadFiles) {
      const relNorm = relPath.replace(/\\/g, '/')
      const preloadFile = path.join(preloadDir, relPath)
      const oldPreloadFile = path.join(oldPreloadDir, relPath)
      if (oldPreloadSet.has(relNorm) && fs.existsSync(oldPreloadFile)) {
        const { isEqual, dataA, dataB } = this.compareJsonFiles(preloadFile, oldPreloadFile)
        if (!isEqual) {
          // Capture the first reason for the difference
          this.firstReason = ''
          this.append(`\n--- DIFF for ${relNorm} ---`)
          this.printDiffToStringWithReason(dataA, dataB)
          this.append('--- END DIFF ---\n')
          if (!this.firstReason) {
            report.push(`SAME: ${relNorm}`)
          } else {
            report.push(`DIFFERENT: ${relNorm} (reason: ${this.firstReason || 'unknown difference'})`)
          }
          allMatch = false
        } else {
          report.push(`SAME: ${relNorm}`)
        }
      } else {
        report.push(`MISSING in old_preload: ${relNorm}`)
        allMatch = false
      }
    }
    for (const relPath of oldPreloadFiles) {
      const relNorm = relPath.replace(/\\/g, '/')
      if (!preloadFiles.map((f) => f.replace(/\\/g, '/')).includes(relNorm)) {
        report.push(`MISSING in preload: ${relNorm}`)
        allMatch = false
      }
    }
    this.append('Comparison Report:')
    for (const line of report) {
      this.append(line)
    }
    if (allMatch) {
      this.append('All JSON files match between preload and old_preload.')
    } else {
      this.append('Some JSON files differ or are missing. See report above.')
    }
    const outPath = path.join(__dirname, 'compare-preload-diff.txt')
    fs.writeFileSync(outPath, this.diffOutput, 'utf8')
    console.log(`Diff output written to ${outPath}`)
  }
  _printDiff(objA, objB, path = '', logFn) {
    let differenceLogged = false
    const logDiff = (line) => {
      logFn(line)
      differenceLogged = true
    }
    if (_.isEqual(objA, objB)) {
      return
    } else if (typeof objA !== typeof objB) {
      return logDiff(`  Type mismatch at ${path}:\n    preload=${typeof objA}\n    old_preload=${typeof objB}`)
    } else if (_.isArray(objA) !== _.isArray(objB)) {
      return logDiff(
        `  Structure mismatch at ${path}:\n    preload is ${_.isArray(objA) ? 'array' : typeof objA}\n    old_preload is ${_.isArray(objB) ? 'array' : typeof objB}`,
      )
    } else if (_.isArray(objA) && _.isArray(objB)) {
      return this._compareArrays(objA, objB, path, logFn)
    } else if (_.isObject(objA) && _.isObject(objB)) {
      const keysA = Object.keys(objA)
      const keysB = Object.keys(objB)
      for (const key of keysA) {
        if (!(key in objB)) {
          logDiff(
            `  Key '${path ? `${path}.` : ''}${key}' missing in old_preload. Value in preload: ${JSON.stringify(objA[key])}`,
          )
        } else {
          this._printDiff(objA[key], objB[key], `${path ? `${path}.` : ''}${key}`, logFn)
        }
      }
      for (const key of keysB) {
        if (!(key in objA)) {
          logDiff(
            `  Key '${path ? `${path}.` : ''}${key}' missing in preload. Value in old_preload: ${JSON.stringify(objB[key])}`,
          )
        }
      }
      return
    } else if (objA !== objB) {
      logDiff(
        `  Value differs at ${path}:\n    preload=${JSON.stringify(objA)}\n    old_preload=${JSON.stringify(objB)}`,
      )
      return
    } else if (!differenceLogged && !_.isEqual(objA, objB)) {
      logDiff(
        `  Difference at ${path || '[root]'}:\n    preload=${JSON.stringify(objA)}\n    old_preload=${JSON.stringify(objB)}`,
      )
    }
  }
  allItemsHaveKey(arr, key) {
    return _.compact(_.map(arr, key)).length === arr.length
  }
  _compareArrays(arrA, arrB, path, logFn) {
    const keyFields = ['username', 'key', 'id']
    // Sort by order if applicable
    const isOrderArrayA = arrA.length > 0 && this.allItemsHaveKey(arrA, 'order')
    const isOrderArrayB = arrB.length > 0 && this.allItemsHaveKey(arrB, 'order')
    if (isOrderArrayA && isOrderArrayB) {
      arrA = _.sortBy(arrA, 'order')
      arrB = _.sortBy(arrB, 'order')
    }
    for (const keyField of keyFields) {
      const isKeyedArrayA = arrA.length > 0 && this.allItemsHaveKey(arrA, keyField)
      const isKeyedArrayB = arrB.length > 0 && this.allItemsHaveKey(arrB, keyField)
      if (isKeyedArrayA && isKeyedArrayB) {
        const mapA = _.keyBy(arrA, keyField)
        const mapB = _.keyBy(arrB, keyField)
        const allKeys = _.union(Object.keys(mapA), Object.keys(mapB))
        for (const key of allKeys) {
          const itemPath = `${path}[${keyField}=${key}]`
          if (key in mapA && key in mapB) {
            this._printDiff(mapA[key], mapB[key], itemPath, logFn)
          } else if (key in mapA) {
            logFn(`  Extra item in preload at ${itemPath}: ${JSON.stringify(mapA[key])}`)
          } else {
            logFn(`  Extra item in old_preload at ${itemPath}: ${JSON.stringify(mapB[key])}`)
          }
        }
        return
      }
    }
    if (arrA.length !== arrB.length) {
      logFn(`  Array length differs at ${path}:\n    preload=${arrA.length}\n    old_preload=${arrB.length}`)
    }
    const maxLength = Math.max(arrA.length, arrB.length)
    for (let i = 0; i < maxLength; i++) {
      const itemPath = `${path}[${i}]`
      if (i < arrA.length && i < arrB.length) {
        this._printDiff(arrA[i], arrB[i], itemPath, logFn)
      } else if (i < arrA.length) {
        logFn(`  Extra item in preload at ${itemPath}: ${JSON.stringify(arrA[i])}`)
      } else {
        logFn(`  Extra item in old_preload at ${itemPath}: ${JSON.stringify(arrB[i])}`)
      }
    }
  }
  printDiffToStringWithReason(objA, objB, path = '') {
    const logFn = (line) => {
      if (!this.firstReason) {
        this.firstReason = line.split('\n')[0].trim()
      }
      this.append(line)
    }
    this._printDiff(objA, objB, path, logFn)
  }
  printDiff(objA, objB, path = '') {
    this._printDiff(objA, objB, path, console.log)
  }
  printDiffToString(objA, objB, path = '') {
    this._printDiff(objA, objB, path, (line) => this.append(line))
  }
}

const _tester = new ComparePreloads(argFile)
