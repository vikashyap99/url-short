import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = "mongodb://127.0.0.1:27017/new-url-short";
const requiredVars = ["MONGODB_URI"];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    console.error(`Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

export const config = Object.freeze({
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 8000,
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  redis: {
    url: process.env.REDIS_URL || null,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
  isDev: (process.env.NODE_ENV || "development") === "development",
  isProd: process.env.NODE_ENV === "production",
});
