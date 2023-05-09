/* //eslint-disable no-unused-expressions */
const CMS = require('../')
const chai = require('chai')
const _ = require('lodash')
const fs = require('fs-extra')
const Q = require('q')
const request = require('supertest')
const path = require('path')
const xlsx = require('xlsx')
const assert = require('assert')
const delay = require('delay')

chai.should()

const MASTER_HTTP_PORT = 9800
const MASTER_URL = `http://localhost:${MASTER_HTTP_PORT}`

let cms = null

const DB = path.join(__dirname, 'data')
const CONFIG = path.join(__dirname, 'cms.json')

const remove = (...files) => {
  _.each(files, file => {
    fs.removeSync(file)
  })
}

before(() => remove(
  DB,
  CONFIG,
  `${__dirname}/xlsxRecords.xlsx`
))

after(() => remove(
  DB,
  CONFIG,
  `${__dirname}/resources`,
  `${__dirname}/xlsxRecords.xlsx`
))

describe('xlsx', () => {
  let cities
  const token = Date.now().toString(36)

  let record1 = {key: 'case-1', enUS: {title: 'case 1 (en)'}, zhCN: {title: 'case 1 (cn)'}, country: 'AUS', city: 'A'}
  let record2 = {key: 'case-2', enUS: {title: 'case 2 (en)'}, zhCN: {title: 'case 2 (cn)'}, country: 'VNM', city: 'A'}
  let record3 = {key: 'case-3', enUS: {title: 'case 3 (en)'}, zhCN: {title: 'case 3 (cn)'}, country: 'VNM', city: 'A'}
  let record4 = {key: 'case-4', enUS: {title: 'case 4 (en)'}, zhCN: {title: 'case 4 (cn)'}, country: 'THA', city: 'A'}
  let record5 = {key: 'case-5', enUS: {title: 'case 5 (en)'}, zhCN: {title: 'case 5 (cn)'}, country: 'THA', city: 'A'}
  let record6 = {key: 'case-6', enUS: {title: 'case 6 (en)'}, zhCN: {title: 'case 6 (cn)'}, country: 'THA', city: 'A'}
  let record7 = {key: 'case-7', enUS: {title: 'case 7 (en)'}, zhCN: {title: 'case 7 (cn)'}, country: 'THA', city: 'A'}
  let record8 = {key: 'case-8', enUS: {title: 'case 8 (en)'}, zhCN: {title: 'case 8 (cn)'}, country: 'AUS', city: 'A'}
  let record9 = {key: 'case-9', enUS: {title: 'case 9 (en)'}, zhCN: {title: 'case 9 (cn)'}, country: 'AUS', city: 'A'}

  const recordKeys = [
    'key',
    'enUS.title',
    'zhCN.title',
    'country',
    'city'
  ]

  const replaceCityId = (record) => {
    record = _.cloneDeep(record)
    record.city = _.find(cities, {key: record.city})._id
    return record
  }

  const replaceCityKey = (record) => {
    record = _.cloneDeep(record)
    record.city = _.find(cities, {_id: record.city}).key
    return record
  }

  before(async () => {
    cms = new CMS({data: DB, config: CONFIG, autoload: true, apiVersion: 2, xlsx: true})

    cms.resource('cities', {
      schema: [
        { field: 'key', input: 'string', unique: true },
        { field: 'name', input: 'string' }
      ]
    })

    cms.resource('xlsxRecords', {
      schema: [
        { field: 'key', input: 'string', required: true, unique: true, localised: false },
        { field: 'title', input: 'string', required: true },
        { field: 'country', input: 'string', required: true, localised: false },
        { field: 'city', input: 'select', source: 'cities', required: true, localised: false }
      ],
      locales: [
        'enUS',
        'zhCN'
      ]
    })
    cms.resource('xlsxNoKeyRecords', {
      schema: [
        { field: 'title', input: 'string', required: true }
      ]
    })

    await Q.ninvoke(cms.express(), 'listen', MASTER_HTTP_PORT)
    await cms.bootstrap()
    await Q.ninvoke(cms, 'allow', 'anonymous', ['xlsxRecords'])
  })

  it('should create cities', async () => {
    const api = cms.api()
    await api('cities').create({key: 'A', name: 'A'})
    await api('cities').create({key: 'B', name: 'B'})
    cities = await api('cities').list()
  })

  it('should create config', async () => {
    const api = cms.api()
    let list = await api('_xlsx').list()
    list.should.be.an('array').to.have.lengthOf(0)

    const record = await api('_xlsx').create({token})
    record.token.should.equal(token)

    list = await api('_xlsx').list()
    list.should.be.an('array').to.have.lengthOf(1)
  })

  it('should not get xlsx file without token', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .expect(500)

    body.error.should.equal('token not match')
  })

  it('should not get xlsx file if resource without unique key', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxNoKeyRecords')
      .query({token})
      .expect(500)

    body.error.should.equal('xlsxNoKeyRecords didn\'t have unique key field')
  })

  it('should get xlsx file with token', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    const ws = wb.Sheets['xlsxRecords']
    const data = xlsx.utils.sheet_to_json(ws, {header: 1})
    data.should.be.an('array').to.have.length(2)
    assert.deepEqual(data[1], recordKeys)
  })

  it('should get xlsx file with 6 record', async () => {
    const api = cms.api()

    record1 = replaceCityId(record1)
    record2 = replaceCityId(record2)
    record3 = replaceCityId(record3)
    record4 = replaceCityId(record4)
    record5 = replaceCityId(record5)
    record6 = replaceCityId(record6)
    record7 = replaceCityId(record7)
    record8 = replaceCityId(record8)
    record9 = replaceCityId(record9)

    await api('xlsxRecords').create(record1)
    await delay(100)
    await api('xlsxRecords').create(record2)
    await delay(100)
    await api('xlsxRecords').create(record3)
    await delay(100)
    await api('xlsxRecords').create(record4)
    await delay(100)
    await api('xlsxRecords').create(record5)
    await delay(100)
    await api('xlsxRecords').create(record6)

    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    const ws = wb.Sheets['xlsxRecords']
    const data = xlsx.utils.sheet_to_json(ws, {header: 1})
    data.should.be.an('array').to.have.length(8)

    assert.deepEqual(data[1], recordKeys)
    assert.deepEqual(data[2], _.map(recordKeys, key => _.get(replaceCityKey(record1), key)))
    assert.deepEqual(data[3], _.map(recordKeys, key => _.get(replaceCityKey(record2), key)))
    assert.deepEqual(data[4], _.map(recordKeys, key => _.get(replaceCityKey(record3), key)))
    assert.deepEqual(data[5], _.map(recordKeys, key => _.get(replaceCityKey(record4), key)))
    assert.deepEqual(data[6], _.map(recordKeys, key => _.get(replaceCityKey(record5), key)))
    assert.deepEqual(data[7], _.map(recordKeys, key => _.get(replaceCityKey(record6), key)))
  })

  it('should get xlsx file with 1 record in AUS', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token, query: {country: 'AUS'}})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    const ws = wb.Sheets['xlsxRecords']
    const data = xlsx.utils.sheet_to_json(ws, {header: 1})
    data.should.be.an('array').to.have.length(3)
    assert.deepEqual(data[1], recordKeys)
    assert.deepEqual(data[2], _.map(recordKeys, key => _.get(replaceCityKey(record1), key)))
  })

  it('should get xlsx file with 2 records in VNM', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token, query: {country: 'VNM'}})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    const ws = wb.Sheets['xlsxRecords']
    const data = xlsx.utils.sheet_to_json(ws, {header: 1})
    data.should.be.an('array').to.have.length(4)
    assert.deepEqual(data[1], recordKeys)
    assert.deepEqual(data[2], _.map(recordKeys, key => _.get(replaceCityKey(record2), key)))
    assert.deepEqual(data[3], _.map(recordKeys, key => _.get(replaceCityKey(record3), key)))
  })

  it('should get xlsx file with 3 records in THA', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token, query: {country: 'THA'}})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    const ws = wb.Sheets['xlsxRecords']
    const data = xlsx.utils.sheet_to_json(ws, {header: 1})
    data.should.be.an('array').to.have.length(5)
    assert.deepEqual(data[1], recordKeys)
    assert.deepEqual(data[2], _.map(recordKeys, key => _.get(replaceCityKey(record4), key)))
    assert.deepEqual(data[3], _.map(recordKeys, key => _.get(replaceCityKey(record5), key)))
    assert.deepEqual(data[4], _.map(recordKeys, key => _.get(replaceCityKey(record6), key)))
  })

  it('should not preview update xlsx status without xlsx', async () => {
    const {body} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/status')
      .query({token, query: {country: 'THA'}})
      .expect(500)
    body.error.should.equal('missing xlsx file')
  })

  it('should preview update xlsx status', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    xlsx.utils.sheet_add_aoa(ws, [_.map(recordKeys, key => _.get(replaceCityKey(record7), key))], {origin: -1})
    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/status')
      .query({token})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)
    body2.create.should.equal(1)
    body2.update.should.equal(0)
  })

  it('should create 1 record by xlsx', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    xlsx.utils.sheet_add_aoa(ws, [_.map(recordKeys, key => _.get(replaceCityKey(record7), key))], {origin: -1})
    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)
    body2.create.should.equal(1)
    body2.update.should.equal(0)

    const api = cms.api()
    let list = await api('xlsxRecords').list()
    list.should.be.an('array').to.have.lengthOf(7)

    const keys = _.keys(record7)
    assert.deepEqual(replaceCityKey(_.pick(_.last(list), keys)), replaceCityKey(record7))
  })

  it('should update 1 record by xlsx', async () => {
    const newTitle = 'case 7 (en) - edited'
    _.set(record7, 'enUS.title', newTitle)

    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    const json = xlsx.utils.sheet_to_json(ws, {header: 1})

    json[8] = _.map(recordKeys, key => _.get(replaceCityKey(record7), key))

    const newWs = xlsx.utils.aoa_to_sheet(json)
    wb.Sheets['xlsxRecords'] = newWs

    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)
    body2.create.should.equal(0)
    body2.update.should.equal(1)

    const api = cms.api()
    let list = await api('xlsxRecords').list()
    list.should.be.an('array').to.have.lengthOf(7)

    const keys = _.keys(record7)
    assert.deepEqual(replaceCityKey(_.pick(_.last(list), keys)), replaceCityKey(record7))
  })

  it('should not create record by xlsx if query field not match', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token, query: {country: 'AUS'}})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    xlsx.utils.sheet_add_aoa(ws, [_.map(recordKeys, key => _.get(record7, key))], {origin: -1})
    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token, query: {country: 'AUS'}})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)
    body2.create.should.equal(0)
    body2.update.should.equal(0)

    const api = cms.api()
    let list = await api('xlsxRecords').list()
    list.should.be.an('array').to.have.lengthOf(7)
  })

  it('should create record by xlsx if query field is match', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token, query: {country: 'AUS'}})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    xlsx.utils.sheet_add_aoa(ws, [_.map(recordKeys, key => _.get(replaceCityKey(record8), key))], {origin: -1})
    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token, query: {country: 'AUS'}})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)
    body2.create.should.equal(1)
    body2.update.should.equal(0)

    const api = cms.api()
    let list = await api('xlsxRecords').list()
    list.should.be.an('array').to.have.lengthOf(8)

    const keys = _.keys(record8)
    assert.deepEqual(replaceCityKey(_.pick(_.last(list), keys)), replaceCityKey(record8))
  })

  it('should not update record by xlsx if query field not match', async () => {
    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    const json = xlsx.utils.sheet_to_json(ws, {header: 1})

    json[8] = ['case-7', 'hello', 'world', 'AUS']

    const newWs = xlsx.utils.aoa_to_sheet(json)
    wb.Sheets['xlsxRecords'] = newWs

    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token, query: {country: 'AUS'}})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)
    body2.create.should.equal(0)
    body2.update.should.equal(0)

    const api = cms.api()
    let list = await api('xlsxRecords').list()
    list.should.be.an('array').to.have.lengthOf(8)

    const keys = _.keys(record7)
    assert.deepEqual(_.pick(list[6], keys), record7)
  })

  it('should update record by xlsx if query field match', async () => {
    _.set(record8, 'enUS.title', 'hello')
    _.set(record8, 'zhCN.title', 'world')

    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    const json = xlsx.utils.sheet_to_json(ws, {header: 1})

    json[9] = _.map(recordKeys, key => _.get(replaceCityKey(record8), key))

    const newWs = xlsx.utils.aoa_to_sheet(json)
    wb.Sheets['xlsxRecords'] = newWs

    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token, query: {country: 'AUS'}})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)
    body2.create.should.equal(0)
    body2.update.should.equal(1)

    const api = cms.api()
    let list = await api('xlsxRecords').list()
    list.should.be.an('array').to.have.lengthOf(8)

    const keys = _.keys(record8)
    assert.deepEqual(replaceCityKey(_.pick(list[7], keys)), replaceCityKey(record8))
  })

  it('should create and update records by xlsx with details', async () => {
    _.set(record8, 'enUS.title', 'case 8 (en)')
    _.set(record8, 'zhCN.title', 'case 8 (cn)')

    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    const json = xlsx.utils.sheet_to_json(ws, {header: 1})

    json[9] = _.map(recordKeys, key => _.get(replaceCityKey(record8), key))
    json[10] = _.map(recordKeys, key => _.get(replaceCityKey(record9), key))

    const newWs = xlsx.utils.aoa_to_sheet(json)
    wb.Sheets['xlsxRecords'] = newWs

    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token, query: {country: 'AUS'}, detail: 'true'})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)

    body2.create.should.be.an('array').to.have.lengthOf(1)
    body2.update.should.be.an('array').to.have.lengthOf(1)

    body2.create[0].key.should.equal('case-9')
    body2.update[0].key.should.equal('case-8')

    const api = cms.api()
    let list = await api('xlsxRecords').list()
    list.should.be.an('array').to.have.lengthOf(9)

    const keys = _.keys(record9)
    assert.deepEqual(replaceCityKey(_.pick(list[7], keys)), replaceCityKey(record8))
    assert.deepEqual(replaceCityKey(_.pick(list[8], keys)), replaceCityKey(record9))
  })

  it('should create and update records by xlsx with missing data', async () => {
    _.set(record8, 'enUS.title', null)
    _.set(record8, 'zhCN.title', null)

    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    const json = xlsx.utils.sheet_to_json(ws, {header: 1})

    json[9] = _.map(recordKeys, key => _.get(replaceCityKey(record8), key))
    json[10] = _.map(recordKeys, key => _.get(replaceCityKey(record9), key))

    const newWs = xlsx.utils.aoa_to_sheet(json)
    wb.Sheets['xlsxRecords'] = newWs

    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token, query: {country: 'AUS'}, detail: 'true'})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(200)

    body2.update.should.be.an('array').to.have.lengthOf(0)
  })

  it('should fail to create and update records by xlsx with missing data', async () => {
    const problemRecord8 = _.cloneDeep(record8)
    _.set(problemRecord8, 'enUS.title', '')
    _.set(problemRecord8, 'zhCN.title', '')

    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    const json = xlsx.utils.sheet_to_json(ws, {header: 1})

    json[9] = _.map(recordKeys, key => _.get(replaceCityKey(problemRecord8), key))

    const newWs = xlsx.utils.aoa_to_sheet(json)
    wb.Sheets['xlsxRecords'] = newWs

    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token, query: {country: 'AUS'}, detail: 'true', checkRequired: 'true'})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(500)

    body2.error.should.equal('record ({"key":"case-8"}) do not have required field (enUS.title)')
  })

  it('should fail to create and update records by xlsx with missing data', async () => {
    const problemRecord8 = _.cloneDeep(record8)
    _.set(problemRecord8, 'enUS.title', 'new record8 title')
    _.set(problemRecord8, 'zhCN.title', 'new record8 title')
    _.set(problemRecord8, 'city', 'C')

    const {body} = await request(MASTER_URL)
      .get('/xlsx/xlsxRecords')
      .query({token})
      .expect(200)
    fs.writeFileSync(`${__dirname}/xlsxRecords.xlsx`, body)
    const wb = xlsx.readFile(`${__dirname}/xlsxRecords.xlsx`)
    let ws = wb.Sheets['xlsxRecords']
    const json = xlsx.utils.sheet_to_json(ws, {header: 1})

    json[9] = _.map(recordKeys, key => _.get(problemRecord8, key))

    const newWs = xlsx.utils.aoa_to_sheet(json)
    wb.Sheets['xlsxRecords'] = newWs

    xlsx.writeFile(wb, `${__dirname}/xlsxRecords.xlsx`)

    const {body: body2} = await request(MASTER_URL)
      .post('/xlsx/xlsxRecords/import')
      .query({token, query: {country: 'AUS'}, detail: 'true', checkRequired: 'true'})
      .attach('xlsx', `${__dirname}/xlsxRecords.xlsx`)
      .expect(500)

    body2.error.should.equal('record ({"key":"case-8"}), required field (city) and value (C) is invalid')
  })
})
