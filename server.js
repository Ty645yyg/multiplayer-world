const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let players = {};
let world = [];
const WORLD_SIZE = 256;

for (let i = 0; i < WORLD_SIZE; i++) {
  world[i] = [];
  for (let j = 0; j < WORLD_SIZE; j++) {
    world[i][j] = 0;
  }
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.emit('init', { world, players });

  socket.on('move', (data) => {
    players[socket.id] = { x: data.x, y: data.y, name: data.name };
    io.emit('playerMoved', { id: socket.id, ...players[socket.id] });
  });

  socket.on('chat', (msg) => {
    const name = players[socket.id]?.name || 'Anonymous';
    io.emit('chat', `${name}: ${msg}`);
  });

  socket.on('setBlock', (data) => {
    const { x, y, blockType } = data;
    if (x >= 0 && x < WORLD_SIZE && y >= 0 && y < WORLD_SIZE) {
      world[x][y] = blockType;
      io.emit('blockUpdated', { x, y, blockType });
    }
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});