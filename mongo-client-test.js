const { MongoClient } = require('mongodb')
const Q = require('q')

const host = 'mongodb://127.0.0.1'

async function run () {
  const client = await Q.ninvoke(MongoClient, 'connect', host, {
    tls: true,
    tlsCertificateKeyFile: './ssl/client.pem',
    tlsCAFile: './ssl/ca.pem'
  })

  console.log(client)

  try {
    // Establish and verify connection
    await client.db('admin').command({ ping: 1 })
    console.log('Connected successfully to server')
  } catch (error) {
    console.error(error)
  } finally {
    await client.close()
  }
}
run().catch(console.dir)
