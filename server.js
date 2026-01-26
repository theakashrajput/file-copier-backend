import app from './src/app.js';
import envData from './config/envData.config.js';
import connectToDB from './config/db/db.js';

const PORT = envData.PORT || 5000;

// 1. UNCAUGHT EXCEPTIONS (Sync bugs)
// Must be defined at the very top
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

let server;

connectToDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log('Error in connecting to MongoDB', error);
    process.exit(1);
  });

// 2. UNHANDLED REJECTIONS (Async bugs)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);

  // Check if server exists before trying to close it
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
