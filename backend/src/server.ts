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
  
  socket.on('disconnect', () => {
    
  });
});

// Start the server
httpServer.listen(port, () => {
  console.log(` Server is started`);
});