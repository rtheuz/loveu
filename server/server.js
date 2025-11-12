const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors());

// Rate limiter for file serving
const fileRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Serve Socket.IO client library with rate limiting
app.get('/socket.io/socket.io.js', fileRateLimiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules/socket.io/client-dist/socket.io.min.js'));
});

// Serve static files from parent directory (for testing) with rate limiting
app.use(fileRateLimiter, express.static(path.join(__dirname, '..')));

// Initialize Socket.IO with CORS support
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store room information
const rooms = new Map();

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room
  socket.on('join-room', ({ roomCode, userName }) => {
    // Leave any previous rooms
    Array.from(socket.rooms).forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join the new room
    socket.join(roomCode);
    
    // Initialize room data if it doesn't exist
    if (!rooms.has(roomCode)) {
      rooms.set(roomCode, {
        participants: [],
        host: socket.id
      });
    }

    const room = rooms.get(roomCode);
    const participant = {
      id: socket.id,
      name: userName || 'Anônimo'
    };

    // Add participant to room
    room.participants.push(participant);

    // Notify user they joined
    socket.emit('room-joined', {
      roomCode,
      isHost: room.host === socket.id,
      participants: room.participants
    });

    // Notify others in the room
    socket.to(roomCode).emit('user-joined', participant);

    console.log(`${userName} (${socket.id}) joined room: ${roomCode}`);
  });

  // Video control events (play, pause, seek, time update)
  socket.on('video-control', (data) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomCode) {
      // Relay to all others in the room
      socket.to(roomCode).emit('video-control', {
        ...data,
        from: socket.id
      });
      console.log(`Video control in ${roomCode}:`, data.action);
    }
  });

  // Heartbeat for drift correction
  socket.on('heartbeat', (data) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomCode) {
      const room = rooms.get(roomCode);
      if (room && room.host === socket.id) {
        // Only host sends heartbeat
        socket.to(roomCode).emit('heartbeat', {
          currentTime: data.currentTime,
          from: socket.id
        });
      }
    }
  });

  // Game move events
  socket.on('game-move', (data) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomCode) {
      socket.to(roomCode).emit('game-move', {
        ...data,
        from: socket.id
      });
      console.log(`Game move in ${roomCode}:`, data);
    }
  });

  // Chat/message events
  socket.on('chat-message', (data) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomCode) {
      // Broadcast to all including sender
      io.to(roomCode).emit('chat-message', {
        ...data,
        from: socket.id
      });
      console.log(`Chat in ${roomCode}:`, data.message);
    }
  });

  // Presence event
  socket.on('presence', (data) => {
    const roomCode = Array.from(socket.rooms).find(r => r !== socket.id);
    if (roomCode) {
      socket.to(roomCode).emit('presence', {
        ...data,
        from: socket.id
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find and remove user from all rooms
    rooms.forEach((room, roomCode) => {
      const index = room.participants.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        const participant = room.participants[index];
        room.participants.splice(index, 1);

        // If room is empty, delete it
        if (room.participants.length === 0) {
          rooms.delete(roomCode);
          console.log(`Room ${roomCode} deleted (empty)`);
        } else {
          // If host left, assign new host
          if (room.host === socket.id && room.participants.length > 0) {
            room.host = room.participants[0].id;
            io.to(roomCode).emit('new-host', {
              hostId: room.host
            });
          }

          // Notify others about the leave
          io.to(roomCode).emit('user-left', {
            id: socket.id,
            name: participant.name
          });
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO server ready to accept connections`);
});
