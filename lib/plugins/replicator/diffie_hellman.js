

import crypto from 'crypto'
import cap from './cap.js'

/*
 * Diffie-Hellman Shared secret, to be used by peers of the same network
 */

const prime = Buffer.from('90b9aba88393569cf93687b9e8473e0ae9d970724ce18ca89a4afd54e7fb1b3bdeb735d4f22fadd8e374581d98d78a923a36f127e50ea957fa275acc1a8db4a3', 'hex')

/*
 * Helpers
 */

/*
 * Write Diffie-Hellman keys to socket as HEX strings
 * prefix them with key length
 *
 * @param {net.Socket} socket
 * @param {Buffer} buf, DH key
 */

const write = function (socket, buf) {
  const str = buf.toString('hex')
  const length = Buffer.alloc(1)
  length.writeUInt8(str.length, 0)
  socket.write(length)
  socket.write(str)
}

/*
 * Read Diffie-Hellman keys from socket as HEX strings
 * use key length to accurately parse them
 *
 * @param {net.Socket} socket
 * @param {Function} callback(key), DH key
 */

const read = function (socket, callback) {
  cap(socket, 1, (buf) => {
    cap(socket, buf.readUInt8(0), (buf) => {
      callback(Buffer.from(buf.toString(), 'hex'))
    })
  })
}

/*
 * Diffie-Hellman server-side flow
 *
 * @param {net.Socket} socket
 * @param {Function} callback, called after handshake has been established
 */

const DH = function (socket, callback) {
  read(socket, (clientPublicKey) => {
    const agent = crypto.createDiffieHellman(prime)
    agent.generateKeys()
    let sharedKey
    try {
      sharedKey = agent.computeSecret(clientPublicKey)
    } catch (e) {
      console.log(e)
      return socket.destroy()
    }
    read(socket, (clientSharedKey) => {
      if (clientSharedKey.toString('hex') !==
          sharedKey.toString('hex')) {
        console.log('KEYS DONT MATCH')
        return socket.destroy()
      }
      callback()
    })
    write(socket, agent.getPublicKey())
  })
}

/*
 * Diffie-Hellman client-side flow
 *
 * @param {net.Socket} socket
 * @param {Function} callback, called after handshake has been established
 */

DH.client = function (socket, callback) {
  const agent = crypto.createDiffieHellman(prime)
  agent.generateKeys()
  read(socket, (serverPublicKey) => {
    write(socket, agent.computeSecret(serverPublicKey))
    callback()
  })
  write(socket, agent.getPublicKey())
}



export default DH
