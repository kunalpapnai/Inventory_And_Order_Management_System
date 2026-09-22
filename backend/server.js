const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const config = require('./config/env');

const startServer = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`Inventory & Order Management API running on port ${config.port}`);
    console.log(`Environment: ${config.nodeEnv}`);
    console.log(`API URL: http://localhost:${config.port}/api`);
    console.log(`Health Check: http://localhost:${config.port}/api/health`);
    console.log(`====================================================`);
  });

  const handleShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDB();
      console.log('Server and DB connection closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
};

startServer();
