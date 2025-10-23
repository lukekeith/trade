import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import symbolsRoutes from './routes/symbols.routes';
import candlesRoutes from './routes/candles.routes';
import trendsRoutes from './routes/trends.routes';
import { WebSocketService } from './services/websocket.service';
import { PollingService } from './services/polling.service';
import { TrendsService } from './services/trends.service';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/symbols', symbolsRoutes);
app.use('/api/candles', candlesRoutes);
app.use('/api/trends', trendsRoutes);

// Add API endpoint to control polling
app.post('/api/polling/start', (req, res) => {
  PollingService.start();
  res.json({ message: 'Polling service started', status: PollingService.getStatus() });
});

app.post('/api/polling/stop', (req, res) => {
  PollingService.stop();
  res.json({ message: 'Polling service stopped', status: PollingService.getStatus() });
});

app.get('/api/polling/status', (req, res) => {
  res.json(PollingService.getStatus());
});

app.post('/api/polling/trigger', async (req, res) => {
  await PollingService.triggerPoll();
  res.json({ message: 'Poll triggered successfully' });
});

// Initialize WebSocket service
const wsService = new WebSocketService(io);

// Initialize polling service
PollingService.init(io);

// Initialize Trends service
const trendsService = new TrendsService(process.env.PYTHON_SERVICE_URL);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('WebSocket service initialized');

  // Start real-time trends broadcasting
  trendsService.start(60000, (trendsData) => {
    wsService.broadcastTrends(trendsData);
  });

  // Optionally start polling on server start
  if (process.env.AUTO_START_POLLING === 'true') {
    console.log('Auto-starting polling service...');
    PollingService.start();
  } else {
    console.log('Polling service ready (use POST /api/polling/start to begin)');
  }
});

export { app, io, wsService };
