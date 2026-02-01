const express = require('express');
const next = require('next');
const http = require('http');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './' });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 4000;

app.prepare().then(() => {
  const server = express();

  // Express middleware
  server.use(express.json());
  server.use(express.urlencoded({ extended: false }));

  // API routes (Express)
  server.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // API routes placeholder - 향후 추가될 API 엔드포인트
  server.use('/api', (req, res, next) => {
    // 여기에 API 라우트 추가
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Next.js 페이지 처리
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  const httpServer = http.createServer(server);

  httpServer.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });
});
