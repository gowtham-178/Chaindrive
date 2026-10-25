import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export const config = {
  // Server
  port: parseInt(optionalEnv('PORT', '5000'), 10),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  isProduction: optionalEnv('NODE_ENV', 'development') === 'production',

  // MongoDB
  mongodbUri: optionalEnv('MONGODB_URI', 'mongodb://localhost:27017/chaindrive'),

  // JWT
  jwtSecret: optionalEnv('JWT_SECRET', 'chaindrive-dev-secret-change-in-production'),
  jwtRefreshSecret: optionalEnv('JWT_REFRESH_SECRET', 'chaindrive-refresh-secret-change-in-production'),
  jwtExpiresIn: optionalEnv('JWT_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: optionalEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  // Blockchain
  hardhatRpcUrl: optionalEnv('HARDHAT_RPC_URL', 'http://127.0.0.1:8545'),
  deployerPrivateKey: optionalEnv(
    'DEPLOYER_PRIVATE_KEY',
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' // Hardhat default #0
  ),

  // Fine conversion (INR to ETH)
  inrToEthRate: parseFloat(optionalEnv('INR_TO_ETH_RATE', '0.000012')),

  // CORS
  frontendUrl: optionalEnv('FRONTEND_URL', 'http://localhost:3000'),

  // File uploads
  uploadsDir: optionalEnv('UPLOADS_DIR', path.join(__dirname, '../../uploads')),
  maxFileSize: 5 * 1024 * 1024, // 5MB
};
