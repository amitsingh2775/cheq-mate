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
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uploadsDirPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDirPath));
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/echos', echosRouter);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP' });
});
app.use((req, res) => {
    res.status(404).json({ error: `Not Found - ${req.method} ${req.originalUrl}` });
});
export default app;
