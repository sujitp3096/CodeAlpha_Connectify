import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

export function configureSockets(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id');
      if (!user) return next(new Error('User not found'));
      socket.userId = String(user._id);
      next();
    } catch { next(new Error('Invalid session')); }
  });

  io.on('connection', (socket) => {
    socket.join(socket.userId);
    const activeUsers = [...io.sockets.adapter.rooms.keys()].filter((room) => /^[a-f\d]{24}$/i.test(room) && io.sockets.adapter.rooms.get(room)?.size);
    socket.emit('presence:snapshot', activeUsers);
    io.emit('presence:update', { userId: socket.userId, online: true });

    socket.on('conversation:join', async (conversationId) => {
      if (typeof conversationId !== 'string') return;
      const isMember = await Conversation.exists({ _id: conversationId, participants: socket.userId });
      if (isMember) socket.join(`conversation:${conversationId}`);
    });
    socket.on('typing:start', ({ conversationId } = {}) => {
      if (typeof conversationId === 'string' && socket.rooms.has(`conversation:${conversationId}`)) socket.to(`conversation:${conversationId}`).emit('typing:update', { conversationId, userId: socket.userId, typing: true });
    });
    socket.on('typing:stop', ({ conversationId } = {}) => {
      if (typeof conversationId === 'string' && socket.rooms.has(`conversation:${conversationId}`)) socket.to(`conversation:${conversationId}`).emit('typing:update', { conversationId, userId: socket.userId, typing: false });
    });
    socket.on('disconnect', () => {
      const room = io.sockets.adapter.rooms.get(socket.userId);
      if (!room || room.size === 0) io.emit('presence:update', { userId: socket.userId, online: false });
    });
  });
}
