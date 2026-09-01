import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health & Info endpoints
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'RailAID Backend API',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', database: 'connected' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚂 RailAID Backend running on http://localhost:${PORT}`);
});

export default app;
