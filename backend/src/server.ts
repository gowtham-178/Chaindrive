import { createApp } from './app';
import { config } from './config';
import { connectDatabase } from './db/connection';

async function startServer(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  app.listen(config.port, () => {
    console.log(`\n🚀 ChainDrive API running on http://localhost:${config.port}`);
    console.log(`   Environment : ${config.nodeEnv}`);
    console.log(`   Database    : ${config.mongodbUri}`);
    console.log(`   Uploads dir : ${config.uploadsDir}\n`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
