// Minimal Express + Socket.IO server for realtime prototype
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.get('/', (req, res) => res.send('loveu realtime prototype server'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
  pingInterval: 10000,
  pingTimeout: 5000
});

// In-memory room members store (prototype only)
const rooms = {}; // rooms[roomId] = [{ id, name }]

function ensureRoom(room) {
  if (!rooms[room]) rooms[room] = [];
}

io.on('connection', (socket) => {
  console.log('conn:', socket.id);

  socket.on('join', ({ room, name }) => {
    if (!room) return;
    ensureRoom(room);
    // add member if not present
    if (!rooms[room].some(m => m.id === socket.id)) {
      rooms[room].push({ id: socket.id, name: name || 'Anon' });
    }
    socket.join(room);
    console.log(`${socket.id} joined ${room} as ${name}`);
    // determine host = first member
    const hostId = rooms[room][0] ? rooms[room][0].id : socket.id;
    // broadcast presence (full list + host)
    io.to(room).emit('presence', { members: rooms[room], hostId });
  });

  socket.on('video-control', ({ room, action, time, meta }) => {
    if (!room) return;
    // forward to others in room
    socket.to(room).emit('video-control', { from: socket.id, action, time, meta });
  });

  socket.on('heartbeat', ({ room, time, type }) => {
    if (!room) return;
    socket.to(room).emit('heartbeat', { from: socket.id, time, type, now: Date.now() });
  });

  socket.on('game-move', ({ room, move }) => {
    if (!room) return;
    socket.to(room).emit('game-move', { from: socket.id, move });
  });

  socket.on('chat-message', ({ room, text, name }) => {
    if (!room) return;
    io.to(room).emit('chat-message', { from: socket.id, name: name || 'Anon', text, ts: Date.now() });
  });

  socket.on('leave', ({ room }) => {
    if (!room) return;
    socket.leave(room);
    if (rooms[room]) {
      rooms[room] = rooms[room].filter(m => m.id !== socket.id);
      const hostId = rooms[room][0] ? rooms[room][0].id : null;
      io.to(room).emit('presence', { members: rooms[room], hostId });
      if (rooms[room].length === 0) delete rooms[room];
    }
  });

  socket.on('disconnect', () => {
    // remove from any room lists
    for (const room of Object.keys(rooms)) {
      const before = rooms[room].length;
      rooms[room] = rooms[room].filter(m => m.id !== socket.id);
      if (rooms[room].length !== before) {
        const hostId = rooms[room][0] ? rooms[room][0].id : null;
        io.to(room).emit('presence', { members: rooms[room], hostId });
        io.to(room).emit('peer-left', { id: socket.id });
        if (rooms[room].length === 0) delete rooms[room];
      }
    }
    console.log('disconnect:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Realtime prototype server listening on port ${PORT}`);
});