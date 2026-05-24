// Redis cache service (Upstash / ioredis)
const Redis = require('ioredis');
const logger = require('../utils/logger');

let client = null;

function isValidRedisUrl(url) {
  return url && (url.startsWith('redis://') || url.startsWith('rediss://'));
}

function getClient() {
  if (!client) {
    const url = process.env.REDIS_URL;
    if (!isValidRedisUrl(url)) {
      logger.warn('REDIS_URL not set or invalid — caching disabled');
      return null;
    }
    client = new Redis(url, {
      tls: url.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 2,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    client.on('error', err => {
      // Log once, then null out so we stop retrying
      logger.warn(`Redis unavailable — caching disabled: ${err.message}`);
      client = null;
    });
  }
  return client;
}

const DEFAULT_TTL = 300; // 5 minutes

async function get(key) {
  const redis = getClient();
  if (!redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error('Cache get error', err);
    return null;
  }
}

async function set(key, value, ttl = DEFAULT_TTL) {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch (err) {
    logger.error('Cache set error', err);
  }
}

async function del(key) {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    logger.error('Cache del error', err);
  }
}

async function delPattern(pattern) {
  const redis = getClient();
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch (err) {
    logger.error('Cache delPattern error', err);
  }
}

module.exports = { get, set, del, delPattern };
