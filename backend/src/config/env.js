import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const parsedPort = Number.parseInt(process.env.PORT ?? '5000', 10);

export const env = {
  port: Number.isNaN(parsedPort) ? 5000 : parsedPort,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: requireEnv('MONGODB_URI'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
};