import http from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { initSocket } from './socket.js';

async function bootstrap() {
  await connectDatabase(env.mongoUri);

  const app = createApp();
  const server = http.createServer(app);
  
  initSocket(server);

  server.listen(env.port, '0.0.0.0', () => {
    console.log(`Backend listening on http://0.0.0.0:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});