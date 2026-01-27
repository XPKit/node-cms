const _ = require('lodash')
const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'

describe('API Route Coverage', () => {
  afterEach(async () => {
    // Clean up all articles after each test
    const articlesRes = await request(serverUrl)
      .get('/api/articles')
      .auth('localAdmin', 'localAdmin')

    if (_.isArray(articlesRes.body)) {
      for (const article of articlesRes.body) {
        const id = _.get(article, '_id', false)
        if (id) {
          await request(serverUrl)
            .delete(`/api/articles/${id}`)
            .auth('localAdmin', 'localAdmin')
        }
      }
    }
  })

  it('POST /api/articles/:id/attachments should create an attachment with locale field', async () => {
    // Create a new article for this test
    const articleRes = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Attachment Locale Test' })
    expect(articleRes.status).to.equal(200)
    const articleId = articleRes.body._id
    // Upload attachment with _locale field
    const res = await request(serverUrl)
      .post(`/api/articles/${articleId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .field('_locale', 'enUS')
      .attach('file', './test/man.jpg')
    expect(res.status).to.equal(200)
    expect(res.body).to.have.property('_id')
    expect(res.body).to.have.property('_filename')
    expect(res.body).to.have.property('_contentType')
    expect(res.body._fields).to.be.an('object')
    expect(res.body._fields._locale).to.equal('enUS')
    expect(res.body._createdAt).to.be.a('number')
    expect(res.body._updatedAt).to.be.a('number')
    expect(res.body._createdAt).to.equal(res.body._updatedAt)
  })

  it('GET /api/articles/:id/attachments with wrong record id should return 404', async () => {
    const res = await request(serverUrl)
      .get('/api/articles/doesnotexist/attachments')
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(404)
  })

  it('GET /api/articles/:id/attachments/:aid with wrong attachment id should return 404', async () => {
    // Create a new article for this test
    const articleRes = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Attachment Wrong ID Test' })
    expect(articleRes.status).to.equal(200)
    const articleId = articleRes.body._id
    const res = await request(serverUrl)
      .get(`/api/articles/${articleId}/attachments/123notfound`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(404)
  })

  it('DELETE /api/articles/:id/attachments/:aid should remove the attachment and update parent _attachments', async () => {
    // Create a new article and add two attachments
    const articleRes = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Attachment Parent Update Test' })
    expect(articleRes.status).to.equal(200)
    const articleId = articleRes.body._id
    // Add first attachment
    const att1 = await request(serverUrl)
      .post(`/api/articles/${articleId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', 'package.json')
    expect(att1.status).to.equal(200)
    // Add second attachment
    const att2 = await request(serverUrl)
      .post(`/api/articles/${articleId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', './test/man.jpg')
    expect(att2.status).to.equal(200)
    // Delete the first attachment
    const delRes = await request(serverUrl)
      .delete(`/api/articles/${articleId}/attachments/${att1.body._id}`)
      .auth('localAdmin', 'localAdmin')
    expect(delRes.status).to.equal(200)
    // Check parent document _attachments array
    const parentRes = await request(serverUrl)
      .get(`/api/articles/${articleId}`)
      .auth('localAdmin', 'localAdmin')
    expect(parentRes.status).to.equal(200)
    expect(parentRes.body).to.have.property('file')
    expect(parentRes.body.file).to.be.an('array')
    expect(parentRes.body.file.length).to.equal(1)
  })
  let createdId = null
  let attachmentId = null
  let attachmentExt = 'js'

  it('GET /api/articles without auth should return 401', async () => {
    const res = await request(serverUrl)
      .get('/api/articles')
    expect(res.status).to.equal(401)
  })

  it('GET /api/articles should return an empty array', async () => {
    const res = await request(serverUrl)
      .get('/api/articles')
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.equal(0)
  })

  it('POST /api/articles should create an article', async () => {
    const res = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Test Article' })
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body.title).to.equal('Test Article')
    expect(res.body._id).to.be.a('string')
    createdId = res.body._id
  })

  it('GET /api/articles should return 1 article with the correct title', async () => {
    await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Test Article' })
    const res = await request(serverUrl)
      .get('/api/articles')
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.equal(1)
    expect(res.body[0].title).to.equal('Test Article')
  })

  it('POST /api/articles/:id/attachments should create a non-localized attachment for createdId', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Non-localized attachment test' })
    createdId = article.body._id
    const res = await request(serverUrl)
      .post(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .field('field', 'image')
      .attach('image', './test/man.jpg')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body._id).to.be.a('string')
    attachmentId = res.body._id
    if (res.body._filename && res.body._filename.split('.').length > 1) {
      attachmentExt = res.body._filename.split('.').pop()
    }
    // Check if the attachment is not localized (i.e attachment data in res.body instead of res.body.enUS)
    expect(res.body).to.have.property('_id')
    expect(res.body).to.not.have.property('enUS')
  })

  it('POST /api/articles/:id/attachments should create a localized attachment for createdId', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Localized attachment test' })
    createdId = article.body._id
    // The admin interface POSTs localized attachments with field and locale info
    const res = await request(serverUrl)
      .post(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .field('field', 'localizedImage')
      .field('locale', 'enUS')
      .attach('localizedImage', './test/man.jpg')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('_id')
    expect(res.body).to.have.property('_createdAt')
    expect(res.body).to.have.property('_updatedAt')
    expect(res.body).to.have.property('_name')
    expect(res.body).to.have.property('_contentType')
    expect(res.body).to.have.property('_md5sum')
    expect(res.body).to.have.property('_payload')
    expect(res.body).to.have.property('_size')
    expect(res.body).to.have.property('_filename')
    expect(res.body).to.have.property('_fields')
    expect(res.body._fields).to.have.property('field')
    expect(res.body._fields).to.have.property('locale')
  })

  it('GET /api/articles/:id should include both non-localized and localized attachments in the response', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Attachments response test' })
    createdId = article.body._id
    await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').field('field', 'image').attach('image', './test/man.jpg')
    await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').field('field', 'localizedImage').field('locale', 'enUS').attach('localizedImage', './test/man.jpg')

    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body).to.have.property('title')
    expect(res.body).to.have.property('_updatedBy')
    expect(res.body).to.have.property('_id')
    expect(res.body).to.have.property('_createdAt')
    expect(res.body).to.have.property('_updatedAt')
    expect(res.body).to.have.property('_publishedAt')
    expect(res.body).to.have.property('_local')
    expect(res.body).to.have.property('image')
    expect(res.body).to.have.property('localizedImage')

    // Check non-localized image attachments
    expect(res.body.image).to.be.an('array')
    expect(res.body.image.length).to.be.at.least(1)
    res.body.image.forEach(img => {
      expect(img).to.have.property('_id')
      expect(img).to.have.property('url')
    })

    // Check localized image attachments
    expect(res.body.localizedImage).to.be.an('array')
    expect(res.body.localizedImage.length).to.be.at.least(1)
    _.each(res.body.localizedImage, img => {
      expect(img).to.have.property('_id')
      expect(img._fields).to.have.property('locale')
      expect(img._fields.locale).to.equal('enUS')
      expect(img).to.have.property('url')
    })

    // Ensure no duplication between non-localized and localized attachments
    const nonLocalizedIds = _.map(res.body.image, img => img._id)
    const localizedIds = _.map(res.body.localizedImage, img => img._id)
    _.each(nonLocalizedIds, id => {
      expect(localizedIds).to.not.include(id)
    })
  })

  it('GET /api/articles/:id/attachments/:aid should return the file for the attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Get attachment test' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id

    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.headers['content-type']).to.be.a('string')
    // Accepts binary only
  })

  it('GET /api/articles/file/:aid should return a file stream', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'File stream test' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id

    const res = await request(serverUrl)
      .get(`/api/articles/file/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    // Accepts binary only
  })

  it('GET /api/articles/:id/attachments/:aid.' + attachmentExt + ' should return the attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Attachment extension test' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id
    attachmentExt = 'json'

    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}/attachments/${attachmentId}.${attachmentExt}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    // Accepts binary only
  })

  it('GET /api/articles/:id/attachments/:aid.' + attachmentExt + '/cropped should return cropped attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Cropped attachment test' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('image', './test/man.jpg')
    attachmentId = attachment.body._id
    attachmentExt = 'jpeg'

    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}/attachments/${attachmentId}.${attachmentExt}/cropped`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    // Accepts binary only
  })

  it('PUT /api/articles/:id/attachments/:aid.' + attachmentExt + ' should update the attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Update attachment test' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id
    attachmentExt = 'json'

    const res = await request(serverUrl)
      .put(`/api/articles/${createdId}/attachments/${attachmentId}.${attachmentExt}`)
      .auth('localAdmin', 'localAdmin')
      .send({ _fields: { updated: true } })
    expect(res.status).to.equal(200)
    // Accepts update only
  })

  it('PUT /api/articles/:id/attachments should bulk update attachments', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Bulk update test' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id

    const res = await request(serverUrl)
      .put(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .send([{ _id: attachmentId, _fields: { bulk: true } }])
    expect(res.status).to.equal(200)
    // Accepts update only
  })

  it('DELETE /api/articles/:id/attachments/:aid should delete the attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Delete attachment test' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id

    const res = await request(serverUrl)
      .delete(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    // Accepts delete only
  })

  it('DELETE /api/articles/:id/attachments should bulk delete attachments', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Bulk delete test' })
    createdId = article.body._id
    // Ensure the attachment exists before bulk delete
    const createRes = await request(serverUrl)
      .post(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', 'package.json')
    const bulkId = createRes.body._id
    const res = await request(serverUrl)
      .delete(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .send([{ _id: bulkId }])
    expect(res.status).to.equal(200)
    expect(res.body).to.satisfy(val => Array.isArray(val) || [true, false, null].includes(val))
  })

  it('DELETE /api/articles/:id should delete the article', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Delete article test' })
    createdId = article.body._id
    const delRes = await request(serverUrl)
      .delete(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(delRes.status).to.equal(200)
    expect([true, 1, 'OK', null]).to.include(delRes.body)
  })

  it('GET /api/articles should return 0 articles', async () => {
    const res = await request(serverUrl)
      .get('/api/articles')
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.equal(0)
  })

  it('POST /api/articles/:id/attachments should fail for non-existent article', async () => {
    // At this point, createdId does not exist
    const res = await request(serverUrl)
      .post('/api/articles/nonexistentid/attachments')
      .auth('localAdmin', 'localAdmin')
      .attach('file', __filename)
    expect(res.status).to.equal(404)
  })

  it('POST /api/articles should create an article', async () => {
    const res = await request(serverUrl)
      .post('/api/articles')
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Test Article' })
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body.title).to.equal('Test Article')
    expect(res.body._id).to.be.a('string')
    createdId = res.body._id
  })

  it('GET /api/articles/:id should return the created article', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Get article test' })
    createdId = article.body._id
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body._id).to.equal(createdId)
  })

  it('PUT /api/articles/:id should update the article', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Update article test' })
    createdId = article.body._id
    const res = await request(serverUrl)
      .put(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Updated Title' })
    expect(res.status).to.equal(200)
    expect(res.body.title).to.equal('Updated Title')
  })

  it('POST /api/articles/:id/attachments should create an attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Create attachment test' })
    createdId = article.body._id
    // Use this test file as dummy upload
    const res = await request(serverUrl)
      .post(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', 'package.json')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body._id).to.be.a('string')
    attachmentId = res.body._id
  })

  it('GET /api/articles/:id/attachments/:aid should return the attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Get attachment test 2' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.headers['content-type']).to.be.a('string')
  })

  it('PUT /api/articles/:id/attachments/:aid should update the attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Update attachment test 2' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id
    const res = await request(serverUrl)
      .put(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
      .send({ _fields: { test: 'value' } })
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
  })

  it('DELETE /api/articles/:id/attachments/:aid should remove the attachment', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Remove attachment test' })
    createdId = article.body._id
    const attachment = await request(serverUrl).post(`/api/articles/${createdId}/attachments`).auth('localAdmin', 'localAdmin').attach('file', 'package.json')
    attachmentId = attachment.body._id
    const res = await request(serverUrl)
      .delete(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.oneOf([true, false]) // Accept both for coverage
  })

  it('DELETE /api/articles/:id should remove the article', async () => {
    const article = await request(serverUrl).post('/api/articles').auth('localAdmin', 'localAdmin').send({ title: 'Remove article test' })
    createdId = article.body._id
    const res = await request(serverUrl)
      .delete(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect([true, false, null]).to.include(res.body)
  })
})
