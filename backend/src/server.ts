import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';


dotenv.config();


connectDB();

const port = process.env.PORT || 8000;

const httpServer = http.createServer(app);


export const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`Socket Connected: User ${socket.id} connected.`);

  // You can add more socket event listeners here
  // e.g., socket.on('joinRoom', (room) => { ... });

  socket.on('disconnect', () => {
    console.log(`Socket Disconnected: User ${socket.id} disconnected.`);
  });
});

// Start the server
httpServer.listen(port, () => {
  console.log(` Server is running on http://localhost:${port}`);
});