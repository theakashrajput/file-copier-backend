import app from './src/app.js';
import envData from './config/envData.config.js';
import connectToDB from './config/db/db.js';
import logger from './config/logger.config.js';

const PORT = envData.PORT || 5000;

// 1. UNCAUGHT EXCEPTIONS (Sync bugs)
// Must be defined at the very top
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', { error: err });
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
  process.exit(1);
});

let server;

connectToDB()
  .then(() => {
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Error in connecting to MongoDB', { error });
    process.exit(1);
  });

// 2. UNHANDLED REJECTIONS (Async bugs)
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', { error: err });
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  // Check if server exists before trying to close it
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
