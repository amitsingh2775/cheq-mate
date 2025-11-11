import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import echosRouter from './routes/echos.router.js';
import usersRouter from './routes/users.router.js';
const app = express();
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allows serving local files
    contentSecurityPolicy: false, // Might be needed for socket.io/audio playback
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uploadsDirPath = path.join(process.cwd(), 'uploads');
console.log(`Serving static files from: ${uploadsDirPath}`); // Log the path
app.use('/uploads', express.static(uploadsDirPath));
// --- API Routes ---
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/echos', echosRouter);
// --- Health Check Route ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});
// --- 404 Not Found Handler ---
app.use((req, res) => {
    res.status(404).json({ error: `Not Found - ${req.method} ${req.originalUrl}` });
});
export default app;
