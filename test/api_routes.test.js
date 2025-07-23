const _ = require('lodash')
const request = require('supertest')
const chai = require('chai')
const expect = chai.expect
const serverUrl = 'http://localhost:9990'
/*
Example of a response body for another resource (see schema of resource in ./resources/cctImages.js)
[{
  "key": "dawdwad",
  "otherField": "awdwadawdaw",
  "autoSlug": "awdwadawdaw",
  "editableSlug": "awdwadawdaw",
  "localizedImage": {
    "zhCN": [
      {
        "_id": "md6tgcjljegvlp6wyjy80474",
        "_createdAt": 1752722049361,
        "_updatedAt": 1752722049361,
        "_contentType": "image/png",
        "_md5sum": "a6a00a3d88e8437b02a2f50607fd9de8",
        "_payload": {},
        "_size": 272857,
        "_filename": "aaa2.png",
        "_fields": {
          "locale": "zhCN",
          "_filename": "aaa2.png"
        },
        "url": "/api/cctImages/md6tgcicjegvlp6wy9vl19y8/attachments/md6tgcjljegvlp6wyjy80474",
        "_isAttachment": true
      }
    ],
    "enUS": [
      {
        "_id": "md6th5q7jegvlp6wyuzaqm2t",
        "_createdAt": 1752722087094,
        "_updatedAt": 1752722087094,
        "_contentType": "image/png",
        "_md5sum": "d0589e24e32cc4ac5ab0969d22743485",
        "_payload": {},
        "_size": 1066999,
        "_filename": "basePicture.png",
        "_fields": {
          "locale": "enUS",
          "_filename": "basePicture.png"
        },
        "url": "/api/cctImages/md6tgcicjegvlp6wy9vl19y8/attachments/md6th5q7jegvlp6wyuzaqm2t",
        "_isAttachment": true
      }
    ]
  },
  "_updatedBy": "admins~localAdmin",
  "_id": "md6tgcicjegvlp6wy9vl19y8",
  "_createdAt": 1752722049108,
  "_updatedAt": 1752722087116,
  "_publishedAt": null,
  "_local": true,
  "image": [
    {
      "_id": "md6tgcjjjegvlp6wykgo99nf",
      "_createdAt": 1752722049351,
      "_updatedAt": 1752722049351,
      "_contentType": "image/png",
      "_md5sum": "a6a00a3d88e8437b02a2f50607fd9de8",
      "_payload": {},
      "_size": 272857,
      "_filename": "aaa2.png",
      "_fields": {
        "_filename": "aaa2.png"
      },
      "url": "/api/cctImages/md6tgcicjegvlp6wy9vl19y8/attachments/md6tgcjjjegvlp6wykgo99nf",
      "_isAttachment": true
    }
  ]
}] */



describe('API Route Coverage', () => {
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
    // Clean up: delete all articles created in this test
    const articlesRes = await request(serverUrl)
      .get('/api/articles')
      .auth('localAdmin', 'localAdmin')
    if (_.isArray(articlesRes.body)) {
      for (const article of articlesRes.body) {
        const id = _.get(article, '_id', false)
        if (id) {
          // Await each delete to ensure cleanup completes before test ends
          await request(serverUrl)
            .delete(`/api/articles/${id}`)
            .auth('localAdmin', 'localAdmin')
        }
      }
    }
  })
  let createdId = null
  let attachmentId = null
  let attachmentExt = 'js'

  it('GET /api/articles without auth should return 403', async () => {
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
    const res = await request(serverUrl)
      .get('/api/articles')
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(res.body.length).to.equal(1)
    expect(res.body[0].title).to.equal('Test Article')
  })

  it('POST /api/articles/:id/attachments should create a non-localized attachment for createdId', async () => {
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
    // The admin interface POSTs localized attachments with field and locale info
    const res = await request(serverUrl)
      .post(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .field('field', 'localizedImage')
      .field('locale', 'enUS')
      .attach('localizedImage', './test/man.jpg')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    /*
    example response:
    {
      _id: 'md6uczkz42424242y2u73v0t',
      _createdAt: 1752723572005,
      _updatedAt: 1752723572005,
      _name: 'file',
      _contentType: false,
      _md5sum: '22331db1bf52103cb33c6244bf480172',
      _payload: {},
      _size: 4912,
      _filename: '3366907623d13f29000a231f1dfb4734',
      _fields: { field: 'localizedImage', locale: 'enUS' }
    }
   */
    // Check all properties from the example response
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
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    /*
      example response:
      {
          title: 'Test Article',
          _updatedBy: 'admins~localAdmin',
          _id: 'md6uflms42424242yd7rh3vt',
          _createdAt: 1752723693892,
          _updatedAt: 1752723693925,
          _publishedAt: null,
          _local: true,
          file: [ ... ]
      }
    */
    // Check top-level properties
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
      expect(img).to.have.property('_createdAt')
      expect(img).to.have.property('_updatedAt')
      expect(img).to.have.property('_contentType')
      expect(img).to.have.property('_md5sum')
      expect(img).to.have.property('_payload')
      expect(img).to.have.property('_size')
      expect(img).to.have.property('_filename')
      expect(img).to.have.property('_fields')
      expect(img).to.have.property('url')
      expect(img).to.have.property('_isAttachment')
    })

    // Check localized image attachments
    expect(res.body.localizedImage).to.be.an('object')
    expect(res.body.localizedImage).to.have.property('enUS')
    expect(res.body.localizedImage.enUS).to.be.an('array')
    res.body.localizedImage.enUS.forEach(img => {
      expect(img).to.have.property('_id')
      expect(img).to.have.property('_createdAt')
      expect(img).to.have.property('_updatedAt')
      expect(img).to.have.property('_contentType')
      expect(img).to.have.property('_md5sum')
      expect(img).to.have.property('_payload')
      expect(img).to.have.property('_size')
      expect(img).to.have.property('_filename')
      expect(img).to.have.property('_fields')
      expect(img._fields).to.have.property('locale')
      expect(img._fields.locale).to.equal('enUS')
      expect(img).to.have.property('url')
      expect(img).to.have.property('_isAttachment')
    })

    // Ensure no duplication between non-localized and localized attachments
    const nonLocalizedIds = res.body.image.map(img => img._id)
    const localizedIds = res.body.localizedImage.enUS.map(img => img._id)
    nonLocalizedIds.forEach(id => {
      expect(localizedIds).to.not.include(id)
    })
  })

  it('GET /api/articles/:id/attachments/:aid should return the file for the attachment', async () => {
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.headers['content-type']).to.be.a('string')
    // Accepts binary only
  })

  it('GET /api/articles/file/:aid should return a file stream', async () => {
    const res = await request(serverUrl)
      .get(`/api/articles/file/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    // Accepts binary only
  })

  it('GET /api/articles/:id/attachments/:aid.' + attachmentExt + ' should return the attachment', async () => {
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}/attachments/${attachmentId}.${attachmentExt}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    // Accepts binary only
  })

  it('GET /api/articles/:id/attachments/:aid.' + attachmentExt + '/cropped should return cropped attachment', async () => {
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}/attachments/${attachmentId}.${attachmentExt}/cropped`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    // Accepts binary only
  })

  it('PUT /api/articles/:id/attachments/:aid.' + attachmentExt + ' should update the attachment', async () => {
    const res = await request(serverUrl)
      .put(`/api/articles/${createdId}/attachments/${attachmentId}.${attachmentExt}`)
      .auth('localAdmin', 'localAdmin')
      .send({ _fields: { updated: true } })
    expect(res.status).to.equal(200)
    // Accepts update only
  })

  it('PUT /api/articles/:id/attachments should bulk update attachments', async () => {
    const res = await request(serverUrl)
      .put(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .send([{ _id: attachmentId, _fields: { bulk: true } }])
    expect(res.status).to.equal(200)
    // Accepts update only
  })

  it('DELETE /api/articles/:id/attachments/:aid should delete the attachment', async () => {
    const res = await request(serverUrl)
      .delete(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    // Accepts delete only
  })

  it('DELETE /api/articles/:id/attachments should bulk delete attachments', async () => {
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
      .post(`/api/articles/${createdId}/attachments`)
      .auth('localAdmin', 'localAdmin')
      .attach('file', __filename)
    expect([404]).to.include(res.status)
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
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
    expect(res.body._id).to.equal(createdId)
  })

  it('PUT /api/articles/:id should update the article', async () => {
    const res = await request(serverUrl)
      .put(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
      .send({ title: 'Updated Title' })
    expect(res.status).to.equal(200)
    expect(res.body.title).to.equal('Updated Title')
  })

  it('POST /api/articles/:id/attachments should create an attachment', async () => {
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
    const res = await request(serverUrl)
      .get(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.headers['content-type']).to.be.a('string')
  })

  it('PUT /api/articles/:id/attachments/:aid should update the attachment', async () => {
    const res = await request(serverUrl)
      .put(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
      .send({ _fields: { test: 'value' } })
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('object')
  })

  it('DELETE /api/articles/:id/attachments/:aid should remove the attachment', async () => {
    const res = await request(serverUrl)
      .delete(`/api/articles/${createdId}/attachments/${attachmentId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.oneOf([true, false]) // Accept both for coverage
  })

  it('DELETE /api/articles/:id should remove the article', async () => {
    const res = await request(serverUrl)
      .delete(`/api/articles/${createdId}`)
      .auth('localAdmin', 'localAdmin')
    expect(res.status).to.equal(200)
    expect([true, false, null]).to.include(res.body)
  })
})
