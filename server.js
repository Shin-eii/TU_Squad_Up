import 'dotenv/config';
import { createApp } from './app.js';
import db from './config/db.js';

const port = Number(process.env.PORT ?? 3000);
const app = createApp();
const server = app.listen(port, () => {
  console.log(`TU Squad Up API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
