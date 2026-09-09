import { Server } from 'socket.io';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    socket.on('send_message', (data) => {
      // Broadcast to everyone in the room (chatId)
      socket.to(data.chatId).emit('receive_message', data);
    });

    socket.on('send_notification', (data) => {
      // Broadcast to specific users or all users for meetings
      socket.broadcast.emit('receive_notification', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

export function getIo() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}
