const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbUsername = process.env.DB_USERNAME || 'admin';
const dbPassword = process.env.DB_PASSWORD || '';
const dbLink = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.ifwh6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbUsername,
  dbPassword,
  mongoUri: process.env.MONGO_URI || dbLink,
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_for_jwt_auth',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD, 10) || 10
};

module.exports = config;
