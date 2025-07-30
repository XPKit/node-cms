#!/usr/bin/env node

'use strict'

const program = require('commander')
// const _ = require('lodash')
const path = require('path')
const prompt = require('prompt')
const autoBind = require('auto-bind')

const ImportWrapper = require('./lib-importFromRemote')

program.on('--help', () => {
  console.log('')
  console.log('  Example:')
  console.log('    $ import-from-remote ./dev.json')
  console.log('')
})

program
  .usage('<config json>')
  .option('-y, --yes', 'Assume Yes to all queries and do not prompt')
  .option('-o, --createOnly', 'create only')
  .parse(process.argv)

if (!program.args[0]) {
  program.help()
  process.exit(1)
}

class ImportManager {
  constructor (config) {
    autoBind(this)
    this.importWrapper = new ImportWrapper()
    this.importWrapper.startImport(config, program.yes, program.createOnly, this.askConfirmation)
  }

  buildUrl(config) {
    return `${config.protocol}${config.host}`
  }

  async askConfirmation () {
    if (program.yes) {
      return
    }
    let schema = {
      name: 'confirm',
      description: `Are you sure you want to import data from ${this.buildUrl(config.remote)} to ${this.buildUrl(config.local)} ? [yes/no]`,
      type: 'string',
      pattern: /^(yes|no)$/i,
      message: 'yes / no',
      required: true
    }
    let answer =  {confirm: 'no'}
    try {
      answer = await prompt.get(schema)
    // eslint-disable-next-line no-unused-vars
    } catch (error) {}
    if (answer.confirm.toLowerCase() !== 'yes') {
      console.log(answer.confirm)
      process.exit(1)
    }
  }
}

let config = require(path.resolve(program.args[0]))

exports = new ImportManager(config)
