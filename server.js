const http = require('http');
const socket = require('./socket'); // Ensure this path points to your socket.js file
const app = require('./app'); // Adjust to your app

const server = http.createServer(app);

// Initialize Socket.IO
const io = socket.init(server);

io.on('connection', (socket) => {
  
  socket.on('disconnect', () => {
    
  });
});

// Your other app configurations...

server.listen(5000, () => {
  console.log('Server running on port 5000');
});
