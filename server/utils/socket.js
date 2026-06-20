import { Server } from 'socket.io'

let io

export const initSocket = (server) => {
  if (!io) {
    io = new Server(server, {
      cors: {
        origin: '*'
      }
    })

    io.on('connection', (socket) => {
      console.log(`Socket connected: ${socket.id}`)

      socket.on('joinAdmin', () => {
        socket.join('admin')
      })

      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`)
      })
    })
  }

  return io
}

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}
