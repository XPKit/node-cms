const _ = require('lodash')
const request = require('supertest')
const expect = require('chai').expect
const serverUrl = 'http://localhost:9990'

describe('Replicator Plugin API', () => {
  it('DEBUG: print /replicator/resources for all nodes', async function () {
    for (const port of [9990, 9991, 9992]) {
      const res = await request(`http://localhost:${port}`)
        .get('/replicator/resources')
      console.log(`Node ${port} /replicator/resources:`, res.body)
    }
  })
  it('GET /replicator/resources should list all resources with type and correct peers', async () => {
    const res = await request(serverUrl).get('/replicator/resources')
    expect(res.status).to.equal(200)
    expect(res.body).to.be.an('array')
    expect(_.get(res, 'body[0]', {})).to.have.keys(['name', 'type', 'peers', 'direction'])
    // Check that articles and authors have correct peers from peersByResource
    const articles = res.body.find(r => r.name === 'articles')
    const authors = res.body.find(r => r.name === 'authors')
    expect(articles).to.exist
    expect(authors).to.exist
    console.log('DEBUG: articles.peers =', articles.peers)
    console.log('DEBUG: authors.peers =', authors.peers)
    expect(articles.peers).to.deep.equal(['http://localhost:9991'])
    expect(authors.peers).to.deep.equal(['http://localhost:9992'])
  })

  it('POST /replicator/sync/:resource should trigger sync for all records', async () => {
    const res = await request(serverUrl).post('/replicator/sync/articles')
    console.warn('result:', res.body)
    expect(res.status).to.equal(200)
    expect(res.body).to.have.property('ok', true)
    expect(res.body.result.resource).to.equal('articles')
  })

  it('POST /replicator/sync/:resource/:id should trigger sync for a specific record', async () => {
    const res = await request(serverUrl).post('/replicator/sync/articles/123')
    expect(res.status).to.equal(200)
    expect(res.body).to.have.property('ok', true)
    expect(res.body.result.resource).to.equal('articles')
    expect(res.body.result.recordId).to.equal('123')
  })

  it('should replicate a new article from normal node to downstream nodes', async function () {
    // Create an article in the normal node (Node A)
    const articleData = { string: 'Replication Test', rate: 5 }
    const createRes = await request('http://localhost:9990')
      .post('/api/articles')
      .send(articleData)
    expect(createRes.status).to.equal(200)
    const createdId = createRes.body && (createRes.body._id || createRes.body.id)
    expect(createdId).to.exist

    // Wait for replication (allow more time for async replication)
    await new Promise(r => setTimeout(r, 4000))

    // Print /replicator/resources for each downstream node
    for (const port of [9991, 9992]) {
      const resourcesRes = await request(`http://localhost:${port}`)
        .get('/replicator/resources')
      console.log(`Downstream node ${port} /replicator/resources:`, resourcesRes.body)
    }
    // Check that the article exists in downstream nodes (Node B and Node C)
    for (const port of [9991, 9992]) {
      const res = await request(`http://localhost:${port}`)
        .get(`/articles/${createdId}`)
      if (res.status !== 200) {
        console.error(`Downstream node ${port} GET /articles/${createdId} failed: status=${res.status}, body=`, res.body)
      } else {
        console.log(`Downstream node ${port} GET /articles/${createdId} status:`, res.status)
        console.log(`Downstream node ${port} GET /articles/${createdId} body:`, res.body)
      }
      expect(res.status).to.equal(200)
      expect(res.body).to.include(articleData)
    }
  })

  it('should NOT replicate modifications from downstream node to normal or other downstream nodes', async function () {
    // Create an article in the normal node (Node A)
    const articleData = { string: 'Downstream Edit Test', rate: 7 }
    const createRes = await request('http://localhost:9990')
      .post('/articles')
      .send(articleData)
    expect(createRes.status).to.equal(200)
    const createdId = createRes.body && (createRes.body._id || createRes.body.id)
    expect(createdId).to.exist

    // Wait for replication
    await new Promise(r => setTimeout(r, 1500))

    // Modify the article in downstream node (Node B)
    const downstreamEdit = { string: 'Edited in Downstream', rate: 99 }
    const editRes = await request('http://localhost:9991')
      .put(`/articles/${createdId}`)
      .send(downstreamEdit)
    expect(editRes.status).to.be.oneOf([200, 204])

    // Wait for possible (but unwanted) replication
    await new Promise(r => setTimeout(r, 1500))

    // Check that the edit is present in Node B (downstream)
    const checkB = await request('http://localhost:9991').get(`/articles/${createdId}`)
    expect(checkB.status).to.equal(200)
    expect(checkB.body).to.include(downstreamEdit)

    // Check that the edit is NOT present in Node A (normal) or Node C (downstream)
    const checkA = await request('http://localhost:9990').get(`/articles/${createdId}`)
    expect(checkA.status).to.equal(200)
    expect(checkA.body).to.include(articleData)

    const checkC = await request('http://localhost:9992').get(`/articles/${createdId}`)
    expect(checkC.status).to.equal(200)
    // Node C should still have the original data, not the downstream edit
    expect(checkC.body).to.include(articleData)
  })
  it('should NOT replicate modifications from downstream node to upstream node', async function () {
    // Assume Node A (9990) is upstream, Node B (9991) is downstream
    // Create an article in the upstream node (Node A)
    const articleData = { string: 'Upstream Test', rate: 42 }
    const createRes = await request('http://localhost:9990')
      .post('/articles')
      .send(articleData)
    expect(createRes.status).to.equal(200)
    const createdId = createRes.body && (createRes.body._id || createRes.body.id)
    expect(createdId).to.exist

    // Wait for replication to downstream
    await new Promise(r => setTimeout(r, 2000))

    // Modify the article in downstream node (Node B)
    const downstreamEdit = { string: 'Edited in Downstream', rate: 99 }
    const editRes = await request('http://localhost:9991')
      .put(`/articles/${createdId}`)
      .send(downstreamEdit)
    expect(editRes.status).to.be.oneOf([200, 204])

    // Wait for possible (but unwanted) replication
    await new Promise(r => setTimeout(r, 2000))

    // Check that the edit is present in Node B (downstream)
    const checkB = await request('http://localhost:9991').get(`/articles/${createdId}`)
    expect(checkB.status).to.equal(200)
    expect(checkB.body).to.include(downstreamEdit)

    // Check that the edit is NOT present in Node A (upstream)
    const checkA = await request('http://localhost:9990').get(`/articles/${createdId}`)
    expect(checkA.status).to.equal(200)
    expect(checkA.body).to.include(articleData)
  })

  it('should NOT replicate modifications from upstream node to other upstream nodes', async function () {
    // This test assumes there is at least one more upstream node (Node C, 9992) for articles
    // Create an article in Node A (upstream)
    const articleData = { string: 'Upstream to Upstream', rate: 77 }
    const createRes = await request('http://localhost:9990')
      .post('/articles')
      .send(articleData)
    expect(createRes.status).to.equal(200)
    const createdId = createRes.body && (createRes.body._id || createRes.body.id)
    expect(createdId).to.exist

    // Wait for replication to downstreams (if any)
    await new Promise(r => setTimeout(r, 2000))

    // Modify the article in Node C (simulate as another upstream, 9992)
    const upstreamEdit = { string: 'Edited in Upstream C', rate: 123 }
    const editRes = await request('http://localhost:9992')
      .put(`/articles/${createdId}`)
      .send(upstreamEdit)
    expect(editRes.status).to.be.oneOf([200, 204])

    // Wait for possible (but unwanted) replication
    await new Promise(r => setTimeout(r, 2000))

    // Check that the edit is present in Node C (upstream)
    const checkC = await request('http://localhost:9992').get(`/articles/${createdId}`)
    expect(checkC.status).to.equal(200)
    expect(checkC.body).to.include(upstreamEdit)

    // Check that the edit is NOT present in Node A (upstream)
    const checkA = await request('http://localhost:9990').get(`/articles/${createdId}`)
    expect(checkA.status).to.equal(200)
    expect(checkA.body).to.include(articleData)
  })
})
