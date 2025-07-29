
const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const fs = require('fs-extra')
const path = require('path')
const serverUrl = 'http://localhost:9990'
const isoCodes = ['AUS', 'NZL', 'PHL', 'THA', 'VNM', 'ZAF', 'KOR', 'QAT', 'BHR', 'MYS', 'SAU', 'KHM', 'ARE']

// Helper: create a mock XLSX file for import
function createMockXlsx(filePath) {
  const xlsx = require('@e965/xlsx')
  const ws = xlsx.utils.aoa_to_sheet([
    ['id', 'name'],
    ['1', 'Test User'],
    ['2', 'Another User']
  ])
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, 'users')
  xlsx.writeFile(wb, filePath)
}

// Helper: create records in markets resource for given ISO codes
async function createMarketRecords() {
  for (const code of isoCodes) {
    await request(serverUrl)
      .post('/api/markets')
      .auth('localAdmin', 'localAdmin')
      .send({ key: code, code: code, name: code })
      .set('Accept', 'application/json')
  }
}
// Create market records for test ISO codes before running tests
before(async () => {
  await createMarketRecords()
})

describe('Import Plugin API', () => {
  describe('GET /import/status', () => {
    it('should return status object', async () => {
      const res = await request(serverUrl).get('/import/status')
      expect(res.status).to.be.equal(200)
      expect(res.body).to.be.an('object')
      // Check if res.body has keys regions, countries, provinces, cities
      expect(res.body).to.have.all.keys(['regions', 'countries', 'provinces', 'cities'])
    })
  })

  describe('GET /import/execute', () => {
    it('should execute import and return status', async () => {
      const res = await request(serverUrl).get('/import/execute')
      expect(res.status).to.be.equal(200)
      expect(res.body).to.be.an('object')
      expect(res.body).to.have.all.keys(['regions', 'countries', 'provinces', 'cities'])
    })
  })

  describe('POST /import/statusXlsx', () => {
    const tmpXlsx = path.join(__dirname, 'mock-import.xlsx')
    before(() => createMockXlsx(tmpXlsx))
    after(() => fs.removeSync(tmpXlsx))

    it('should return import status for XLSX file', async () => {
      const res = await request(serverUrl)
        .post('/import/statusXlsx')
        .attach('xlsx', tmpXlsx)
      expect(res.status).to.be.equal(200)
      expect(res.body).to.be.an('object')
      // If the users resource exists, expect keys for users.create, users.update, etc.
    })
  })

  describe('POST /import/executeXlsx', () => {
    const tmpXlsx = path.join(__dirname, 'mock-import.xlsx')
    before(() => createMockXlsx(tmpXlsx))
    after(() => fs.removeSync(tmpXlsx))

    it('should execute XLSX import and return status', async () => {
      const res = await request(serverUrl)
        .post('/import/executeXlsx')
        .attach('xlsx', tmpXlsx)
      expect(res.status).to.be.equal(200)
      expect(res.body).to.be.an('object')
      // If import is successful, expect keys for users.create, users.update, etc.
    })
  })

  describe('Error handling', () => {
    it('should return error for malformed XLSX', async () => {
      const res = await request(serverUrl)
        .post('/import/statusXlsx')
        .attach('xlsx', __filename) // Not a real XLSX
      expect(res.status).to.be.oneOf([400, 500, 404])
    })
    it('should return error for missing file', async () => {
      const res = await request(serverUrl)
        .post('/import/statusXlsx')
      expect(res.status).to.be.oneOf([400, 500, 404])
    })
  })

  // Optionally, add a test to verify that import actually changes resource data
  // This requires a known resource and a way to query it after import
  // Example (pseudo):
  // it('should import users and reflect in /api/users', async () => {
  //   // 1. Import users via XLSX
  //   // 2. Query /api/users and expect imported users to exist
  // })
})
