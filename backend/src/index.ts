import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { defectsRouter } from './routes/defects';
import { corridorsRouter } from './routes/corridors';
import { scheduleRouter } from './routes/schedule';
import { metricsRouter } from './routes/metrics';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Read allowed origins from env or default to standard Vite / React dev ports
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
];

const allowedOrigins = [...new Set([...envOrigins, ...defaultOrigins])];

// 1. Global CORS middleware registered BEFORE any route registration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile apps, or backend-to-backend)
      if (!origin) return callback(null, true);

      // Allow if explicitly configured or matches any localhost / 127.0.0.1 port
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Explicit pre-flight handler
app.options('*', cors());

app.use(express.json());

// Base health & info endpoints
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'RailAID Backend API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'railaid-backend' });
});

// 2. Mount all API routers on the main app instance AFTER CORS middleware
app.use('/api/defects', defectsRouter);
app.use('/api', corridorsRouter); // provides /api/timetable and /api/goods-forecast
app.use('/api/schedule', scheduleRouter); // provides /api/schedule, /api/schedule/generate
app.use('/api/metrics', metricsRouter); // provides /api/metrics

// Global error-handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred while processing your request.',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚂 RailAID Backend running on http://localhost:${PORT}`);
});

export default app;
