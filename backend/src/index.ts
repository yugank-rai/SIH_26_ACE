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

// CORS configuration allowing frontend origin
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

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

// Mount API routes
app.use('/api/defects', defectsRouter);
app.use('/api', corridorsRouter); // provides /api/timetable and /api/goods-forecast
app.use('/api/schedule', scheduleRouter); // provides /api/schedule, /api/schedule/generate
app.use('/api/metrics', metricsRouter); // provides /api/metrics

// Global error-handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred while processing your request.',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚂 RailAID Backend running on http://localhost:${PORT}`);
});

export default app;
