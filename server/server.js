import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { connectDatabase } from './config/db.js';
import { configureSockets } from './sockets/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import postRoutes from './routes/postRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import storyRoutes from './routes/storyRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, { cors: { origin: allowedOrigin, methods: ['GET', 'POST', 'PATCH', 'DELETE'], credentials: true } });
configureSockets(io);
app.use((req, _res, next) => { req.io = io; next(); });
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', app: 'Connectify API' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stories', storyRoutes);
app.use((_req, res) => res.status(404).json({ message: 'The requested API endpoint does not exist.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.name === 'MulterError' ? 400 : (error.status || 500);
  res.status(status).json({ message: error.message || 'Something went wrong on the server.' });
});

const port = Number(process.env.PORT || 5000);
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be set in server/.env and contain at least 32 characters.');
  process.exit(1);
}
connectDatabase().then(() => server.listen(port, () => console.log(`✓ Connectify API running at http://localhost:${port}`)))
  .catch((error) => { console.error('Could not start Connectify:', error.message); process.exit(1); });

process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));
