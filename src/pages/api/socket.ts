import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/socket';

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.io server...');

    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'], // Prefer websocket over polling
      allowEIO3: true, // Allow Engine.IO v3 for better compatibility
    });

    // Socket.io connection handler
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join room
      socket.on('join-room', (roomId: string, userId: string, userName?: string) => {
        console.log(`\n👤 ===== JOIN-ROOM EVENT =====`);
        console.log(`User: ${userId} (${userName})`);
        console.log(`Room: ${roomId}`);
        console.log(`Socket ID: ${socket.id}`);

        socket.join(roomId);
        console.log(`✅ Socket ${socket.id} joined room ${roomId}`);

        // Store user info in socket
        (socket as any).userId = userId;
        (socket as any).userName = userName || 'User';
        (socket as any).roomId = roomId;

        // Get all sockets in the room BEFORE notifying
        const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
        const existingUsers: any[] = [];

        console.log(`📊 Total sockets in room ${roomId}: ${socketsInRoom?.size || 0}`);

        if (socketsInRoom) {
          socketsInRoom.forEach((socketId) => {
            if (socketId !== socket.id) {
              const existingSocket = io.sockets.sockets.get(socketId);
              if (existingSocket) {
                const existingUserId = (existingSocket as any).userId;
                const existingUserName = (existingSocket as any).userName || 'User';
                existingUsers.push({
                  userId: existingUserId,
                  userName: existingUserName,
                  socketId: socketId,
                });
                console.log(`   - Existing user: ${existingUserId} (${existingUserName}) [${socketId}]`);
              }
            }
          });
        }

        // Send existing users to the newly joined user
        if (existingUsers.length > 0) {
          console.log(`📤 Sending ${existingUsers.length} existing users to new user ${userId}`);
          existingUsers.forEach(user => {
            console.log(`   Notifying ${userId} about existing user: ${user.userId} (${user.userName})`);
            socket.emit('user-connected', user);
          });
        } else {
          console.log(`ℹ️  No existing users in room - ${userId} is the first or only user`);
        }

        // Notify others in the room about the new user
        const newUserData = {
          userId,
          userName: userName || 'User',
          socketId: socket.id,
        };
        console.log(`📢 Broadcasting new user to others in room:`, newUserData);
        socket.to(roomId).emit('user-connected', newUserData);

        console.log(`===== JOIN-ROOM COMPLETE =====\n`);
      });

      // WebRTC signaling - offer
      socket.on('offer', (data: { roomId: string; offer: any; to: string; userId?: string; userName?: string }) => {
        const fromUserId = data.userId || (socket as any).userId || socket.id;
        const fromUserName = data.userName || (socket as any).userName || 'User';
        console.log('📨 Offer received from:', fromUserId, fromUserName, 'to room:', data.roomId);

        // Broadcast to everyone in the room except the sender
        socket.to(data.roomId).emit('offer', {
          offer: data.offer,
          from: fromUserId,
          userName: fromUserName,
        });

        console.log('✅ Offer broadcasted to room:', data.roomId);
      });

      // WebRTC signaling - answer
      socket.on('answer', (data: { roomId: string; answer: any; to: string; userId?: string; userName?: string }) => {
        const fromUserId = data.userId || (socket as any).userId || socket.id;
        const fromUserName = data.userName || (socket as any).userName || 'User';
        console.log('📬 Answer received from:', fromUserId, fromUserName, 'to room:', data.roomId);

        // Broadcast to everyone in the room except the sender
        socket.to(data.roomId).emit('answer', {
          answer: data.answer,
          from: fromUserId,
          userName: fromUserName,
        });

        console.log('✅ Answer broadcasted to room:', data.roomId);
      });

      // ICE candidate exchange
      socket.on('ice-candidate', (data: { roomId: string; candidate: any; to?: string; userId?: string }) => {
        const fromUserId = data.userId || (socket as any).userId || socket.id;
        console.log('🧊 ICE candidate received from:', fromUserId, 'to room:', data.roomId);

        // Broadcast to everyone in the room except the sender
        socket.to(data.roomId).emit('ice-candidate', {
          candidate: data.candidate,
          from: fromUserId,
        });

        console.log('✅ ICE candidate broadcasted to room:', data.roomId);
      });

      // Leave room
      socket.on('leave-room', (roomId: string, userId: string) => {
        console.log(`User ${userId} leaving room ${roomId}`);
        socket.leave(roomId);
        socket.to(roomId).emit('user-disconnected', userId);
      });

      // Chat message
      socket.on('chat-message', (data: { roomId: string; message: string; userName: string; userId: string }) => {
        console.log('Chat message in room:', data.roomId, 'from:', data.userName);
        // Broadcast to everyone in the room INCLUDING the sender
        // This is correct - the client should show the message for everyone
        io.to(data.roomId).emit('chat-message', {
          message: data.message,
          userName: data.userName,
          userId: data.userId,
          timestamp: new Date().toISOString(),
        });
      });

      // Session ended by admin
      socket.on('end-session', (data: { roomId: string; adminId: string }) => {
        console.log('📢 Admin ending session in room:', data.roomId, 'by admin:', data.adminId);
        // Broadcast to everyone in the room including the admin
        io.to(data.roomId).emit('session-ended', { adminId: data.adminId });
        console.log('✅ Session-ended event broadcast to all participants in room:', data.roomId);
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Notify room about disconnection
        const roomId = (socket as any).roomId;
        const userId = (socket as any).userId;
        if (roomId && userId) {
          socket.to(roomId).emit('user-disconnected', userId);
        }
      });
    });

    res.socket.server.io = io;
    console.log('Socket.io server initialized');
  } else {
    console.log('Socket.io server already running');
  }

  res.end();
};

export default SocketHandler;
