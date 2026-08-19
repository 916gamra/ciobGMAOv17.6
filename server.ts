import express from 'express';
import { createServer as createViteServer } from 'vite';
import helmet from 'helmet';
import path from 'path';
import { execFile } from 'child_process';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic Security Headers, relaxed for iframe preview support
  app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false
  }));
  app.use(express.json());

  // --- API Routes ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'TITANIC OS Hybrid API Active', pythonSupported: true });
  });

  // Python ML Predictive Maintenance Endpoint
  app.post('/api/ml/predict-maintenance', (req, res) => {
    const historyData = req.body.history || [];
    const jsonString = JSON.stringify(historyData);

    const scriptPath = path.join(process.cwd(), 'python', 'ml_engine.py');
    execFile('python3', [scriptPath, jsonString], (error, stdout) => {
      if (error) {
        return res.status(500).json({ status: 'error', message: 'Failed to run Python ML engine', details: error.message });
      }
      try {
        const parsed = JSON.parse(stdout);
        return res.json(parsed);
      } catch (e) {
        return res.status(500).json({ status: 'error', message: 'Invalid output from Python ML engine', stdout });
      }
    });
  });

  // Sync offline data to central server
  app.post('/api/sync', (req, res) => {
    // In the future: Rate limiting and payload validation with Zod
    res.json({ status: 'success', syncedAt: new Date().toISOString() });
  });

  // --- Vite Middleware (Development / Frontend Fallback) ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[System Core] API & App Server running on http://localhost:${PORT}`);
  });

  server.on('error', (e: any) => {
    if (e.code === 'EADDRINUSE') {
      console.warn(`[System Core] Port ${PORT} busy, retrying...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT, '0.0.0.0');
      }, 1000);
    }
  });
}

startServer();
