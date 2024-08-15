/* eslint-disable standard/no-callback-literal */



const cap = require('./cap')
const net = require('net')
const dh = require('./diffie_hellman')

/*
 * Parse protocol headers
 */

const read = function (socket, cb) {
  cap(socket, 1, (buf) => {
    cap(socket, buf.readUInt8(0), tempName => {
      tempName = tempName.toString()
      let id = tempName.substring(0, 8)
      let name = tempName.substring(8)
      cb(name, id)
    })
  })
}

/*
 * Write client protocol headers
 */

const write = function (socket, name, id) {
  const length = Buffer.alloc(1)
  const tempName = `${id}${name}`
  length.writeUInt8(tempName.length, 0)
  socket.write(length)
  socket.write(tempName)
}

/*
 * Server socket & client socket
 */

exports = module.exports = {
  Server (port, id, cb) {
    net.createServer({ allowHalfOpen: true }, socket => {
      socket.setTimeout(30000, () => {
        socket.destroy()
      })
      dh(socket, () => {
        write(socket, '', id)
        read(socket, (name, id) => {
          cb(null, socket, name, id)
        })
      })
    }).listen(port)
  },
  Client (host, port, name, id, cb) {
    const socket = net.connect(port, host)
    let socketError = false

    function onError (err) {
      socketError = true
      cb(err)
    }

    function onClose (hasErrors) {
      if (socketError || hasErrors) {
        return cb('has errors')
      }
      cb()
    }

    socket.on('connect', () => {
      dh.client(socket, () => {
        write(socket, name, id)
        read(socket, (name, id) => {
          socket.removeListener('error', onError)
          socket.removeListener('close', onClose)
          cb(null, socket, id)
        })
      })
    })

    socket.on('error', onError)
    socket.on('close', onClose)
  }
}
