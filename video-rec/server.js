const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Store rooms and their data
const rooms = {};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Admin creates a room
  socket.on('createRoom', ({ roomCode, adminName }) => {
    if (rooms[roomCode]) {
      socket.emit('roomError', 'Room code already exists');
      return;
    }

    rooms[roomCode] = {
      admin: socket.id,
      adminName,
      users: [],
      mainScreen: null,
      pendingUsers: []
    };

    socket.join(roomCode);
    socket.emit('roomCreated', { roomCode, adminName });
    console.log(`Room ${roomCode} created by ${adminName}`);
  });

  // User requests to join a room
  socket.on('joinRoom', ({ roomCode, userName }) => {
    if (!rooms[roomCode]) {
      socket.emit('roomError', 'Room not found');
      return;
    }

    const room = rooms[roomCode];
    room.pendingUsers.push({ socketId: socket.id, userName });

    // Notify admin about pending user
    io.to(room.admin).emit('userPending', { socketId: socket.id, userName });
    socket.emit('waitingForApproval');
  });

  // Admin approves user
  socket.on('approveUser', ({ roomCode, socketId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const pendingIndex = room.pendingUsers.findIndex(u => u.socketId === socketId);
    if (pendingIndex === -1) return;

    const user = room.pendingUsers.splice(pendingIndex, 1)[0];
    room.users.push({ socketId: user.socketId, userName: user.userName });

    const userSocket = io.sockets.sockets.get(socketId);
    if (userSocket) {
      userSocket.join(roomCode);
      userSocket.emit('approved', { roomCode, adminName: room.adminName });
    }

    // Notify all users in room
    io.to(roomCode).emit('userJoined', { userName: user.userName });
    console.log(`User ${user.userName} approved in room ${roomCode}`);
  });

  // Admin rejects user
  socket.on('rejectUser', ({ socketId }) => {
    const userSocket = io.sockets.sockets.get(socketId);
    if (userSocket) {
      userSocket.emit('rejected');
    }
  });

  // WebRTC signaling
  socket.on('offer', ({ roomCode, offer, targetSocketId }) => {
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit('offer', { offer, fromSocketId: socket.id });
    }
  });

  socket.on('answer', ({ answer, targetSocketId }) => {
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit('answer', { answer, fromSocketId: socket.id });
    }
  });

  socket.on('iceCandidate', ({ candidate, targetSocketId }) => {
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.emit('iceCandidate', { candidate, fromSocketId: socket.id });
    }
  });

  // User starts sharing screen
  socket.on('startSharing', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.users = room.users.map(u => 
      u.socketId === socket.id ? { ...u, sharing: true } : u
    );

    // Notify admin to initiate WebRTC connection
    io.to(room.admin).emit('userStartedSharing', { socketId: socket.id });
  });

  // User stops sharing screen
  socket.on('stopSharing', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.users = room.users.map(u => 
      u.socketId === socket.id ? { ...u, sharing: false } : u
    );

    io.to(roomCode).emit('userStoppedSharing', { socketId: socket.id });
  });

  // Admin sets main screen
  socket.on('setMainScreen', ({ roomCode, socketId }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.mainScreen = socketId;
    io.to(roomCode).emit('mainScreenChanged', { socketId });
  });

  // Admin starts recording
  socket.on('startRecording', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    io.to(roomCode).emit('recordingStarted');
  });

  // Admin stops recording
  socket.on('stopRecording', ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    io.to(roomCode).emit('recordingStopped');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Clean up rooms
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      
      // If admin disconnects, close the room
      if (room.admin === socket.id) {
        io.to(roomCode).emit('roomClosed');
        delete rooms[roomCode];
        console.log(`Room ${roomCode} closed`);
      } else {
        // Remove user from room
        room.users = room.users.filter(u => u.socketId !== socket.id);
        room.pendingUsers = room.pendingUsers.filter(u => u.socketId !== socket.id);
        
        if (room.mainScreen === socket.id) {
          room.mainScreen = null;
          io.to(roomCode).emit('mainScreenChanged', { socketId: null });
        }

        io.to(roomCode).emit('userLeft', { socketId });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
