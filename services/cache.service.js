import { config } from "../config/index.js";

class CacheService {
  constructor() {
    this.client = null;
    this.enabled = false;
  }

  async init() {
    if (!config.redis.url) {
      console.log("Redis not configured — caching disabled");
      return;
    }
    try {
      const { Redis } = await import("ioredis");
      this.client = new Redis(config.redis.url, {
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });
      await this.client.connect();
      this.enabled = true;
      console.log("Redis connected — caching enabled");
    } catch (error) {
      console.warn("Redis connection failed — caching disabled:", error.message);
      this.client = null;
      this.enabled = false;
    }
  }

  async get(key) {
    if (!this.enabled || !this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    if (!this.enabled || !this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch {
    }
  }

  async del(key) {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.del(key);
    } catch {
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.enabled = false;
    }
  }
}

export const cacheService = new CacheService();
