const request = require('supertest')
const chai = require('chai')
const _ = require('lodash')
const fs = require('fs-extra')
const os = require('os')
const path = require('path')
const xlsx = require('@e965/xlsx')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'
const token = 'xlsx-test-token'
const auth = ['localAdmin', 'localAdmin']

const binaryParser = (res, callback) => {
  const chunks = []
  res.on('data', chunk => chunks.push(chunk))
  res.on('end', () => callback(null, Buffer.concat(chunks)))
}

const download = async (resource) => {
  return request(serverUrl).get(`/xlsx/${resource}?token=${token}`).buffer(true).parse(binaryParser)
}

const create = async (resource, body) => {
  const res = await request(serverUrl).post(`/api/${resource}`).auth(...auth).send(body)
  expect(res.status, `create ${resource}`).to.equal(200)
  return res.body
}

const remove = async (resource, id) => {
  if (id) {
    await request(serverUrl).delete(`/api/${resource}/${id}`).auth(...auth)
  }
}

const rows = (workbook, sheetName) => xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 })

describe('XLSX Plugin API', () => {
  const created = { provinces: [], cities: [] }
  let tmpDir
  let exported

  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'node-cms-xlsx-'))
    const p1 = await create('provinces', { key: 'p1', name: { en: 'Province 1' } })
    const p2 = await create('provinces', { key: 'p2', name: { en: 'Province 2' } })
    created.provinces = [p1._id, p2._id]
    const c1 = await create('cities', { key: 'c1', name: { en: 'City 1', zh: '城市一' }, province: p1._id })
    const c2 = await create('cities', { key: 'c2', name: { en: 'City 2' }, province: p1._id })
    created.cities = [c1._id, c2._id]
  })

  after(async () => {
    for (const id of created.cities) {
      await remove('cities', id)
    }
    for (const id of created.provinces) {
      await remove('provinces', id)
    }
    await fs.remove(tmpDir)
  })

  it('GET /xlsx/:resource rejects a wrong token', async () => {
    const res = await request(serverUrl).get('/xlsx/cities?token=wrong')
    expect(res.status).to.equal(500)
    expect(res.body.error).to.equal('token not match')
  })

  it('GET /xlsx/:resource returns a workbook with a label row, a key row and one row per record', async () => {
    const res = await download('cities')
    expect(res.status).to.equal(200)
    expect(res.headers['content-type']).to.equal('application/octet-stream')
    expect(res.headers['content-disposition']).to.equal('attachment; filename=cities.xlsx')
    exported = xlsx.read(res.body, { type: 'buffer' })
    expect(exported.SheetNames).to.deep.equal(['cities', 'provinces'])
    const sheet = rows(exported, 'cities')
    expect(sheet[0]).to.deep.equal(['Key', 'Name (en)', 'Name (zh)', 'Name (th)', 'Name (vi)', 'Name (ko)', 'Name (ar)', 'Name (kh)', 'Province'])
    expect(sheet[1]).to.deep.equal(['key', 'name.en', 'name.zh', 'name.th', 'name.vi', 'name.ko', 'name.ar', 'name.kh', 'province'])
    const byKey = _.keyBy(sheet.slice(2), 0)
    expect(byKey.c1.slice(0, 3)).to.deep.equal(['c1', 'City 1', '城市一'])
    expect(byKey.c1[8], 'select field exported as the related record key').to.equal('p1')
    expect(byKey.c2[1]).to.equal('City 2')
  })

  it('GET /xlsx/:resource adds one sheet per related resource', async () => {
    const related = rows(exported, 'provinces')
    expect(related[0]).to.deep.equal(['key', 'name.en', 'name.zh', 'name.th', 'name.vi', 'name.ko', 'name.ar', 'name.kh'])
    expect(_.map(related.slice(1), 0)).to.have.members(['p1', 'p2'])
    expect(_.find(related, row => row[0] === 'p1')[1]).to.equal('Province 1')
  })

  it('POST /xlsx/:resource/status reports nothing to create or update for an unmodified export', async () => {
    const filePath = path.join(tmpDir, 'cities.xlsx')
    xlsx.writeFile(exported, filePath)
    const res = await request(serverUrl).post(`/xlsx/cities/status?token=${token}`).attach('xlsx', filePath)
    expect(res.status).to.equal(200)
    expect(res.body, 'both rows matched existing records by key and are unchanged').to.deep.equal({ create: 0, update: 0 })
  })

  it('POST /xlsx/:resource/import applies an edited relation cell', async () => {
    const sheet = exported.Sheets.cities
    const keyCell = _.findKey(sheet, cell => _.get(cell, 'v', null) === 'c2')
    const provinceCell = keyCell.replace(/^[A-Z]+/, 'I')
    sheet[provinceCell] = { t: 's', v: 'p2' }
    const filePath = path.join(tmpDir, 'cities-edited.xlsx')
    xlsx.writeFile(exported, filePath)
    const res = await request(serverUrl).post(`/xlsx/cities/import?token=${token}`).attach('xlsx', filePath)
    expect(res.status).to.equal(200)
    expect(res.body, 'only the edited row is an update').to.deep.equal({ create: 0, update: 1 })
    const city = await request(serverUrl).get(`/api/cities/${created.cities[1]}`).auth(...auth)
    expect(city.body.province).to.equal(created.provinces[1])
  })
})
