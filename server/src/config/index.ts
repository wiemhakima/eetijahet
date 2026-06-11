// ============================================================
// CONFIG — Application configuration (TypeScript)
// ============================================================
import dotenv from 'dotenv';
import type { AppConfig } from '../types';

dotenv.config();

const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',
  pythonPath: process.env.PYTHON_PATH || 'python3',
  modelPath: process.env.MODEL_PATH || './src/models/eta_model.txt',
  logLevel: process.env.LOG_LEVEL || 'info',
  apiVersion: process.env.API_VERSION || 'v1',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '10000', 10),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/etijahet',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

export default config;
