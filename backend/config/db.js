const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const dbLink = config.mongoUri;
    console.log('Connecting to MongoDB Atlas Cluster...');
    
    await mongoose.connect(dbLink, {
      dbName: 'inventory_order_db'
    });

    console.log('Connected to MongoDB Atlas (inventory_order_db) successfully.');
  } catch (fatalError) {
    console.error('Fatal MongoDB Atlas connection error:', fatalError.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB Atlas.');
  } catch (err) {
    console.error('Error disconnecting DB:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };
