import 'dotenv/config';
import { app } from './app.js';

const PORT = Number(process.env.PORT || 5001);

// Start the Express API server for local development.
const server = app.listen(PORT, () => {
  console.log(`FresherAI backend running on http://localhost:${PORT}`);
});

server.on('error', (error) => {
  const detail = error.code === 'EADDRINUSE'
    ? `Port ${PORT} is already in use. Inspect it with: lsof -nP -iTCP:${PORT} -sTCP:LISTEN`
    : `Could not start the FresherAI backend on port ${PORT}: ${error.message}`;
  console.error(detail);
  process.exitCode = 1;
});
