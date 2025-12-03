import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"

let io: SocketIOServer | null = null

export function initializeSocket(server: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id)

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id)
    })

    // Join room for specific post updates
    socket.on("join-post", (postId: string) => {
      socket.join(`post:${postId}`)
    })

    // Leave post room
    socket.on("leave-post", (postId: string) => {
      socket.leave(`post:${postId}`)
    })
  })

  return io
}

export function getSocket() {
  return io
}

export function emitPostUpdate(postId: string, data: any) {
  if (io) {
    io.to(`post:${postId}`).emit("post-update", data)
  }
}

export function emitNewPost(data: any) {
  if (io) {
    io.emit("new-post", data)
  }
}


