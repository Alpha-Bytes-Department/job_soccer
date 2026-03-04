// redisClient.ts
import Redis from "ioredis";
import config from "../../config";

// Create the Redis client instance
const createRedisClient = (): Redis => {
  return new Redis({
    host: "127.0.0.1",
    port: Number(config.redis.port),
    db: 0,
    connectTimeout: 5000,
    lazyConnect: true,

    maxRetriesPerRequest: null,

    enableReadyCheck: true,
    retryStrategy: (times: number) => {
      console.warn(`Redis reconnection attempt ${times}`);
      if (times > 10) {
        console.error("Redis max reconnection attempts reached");
      }

      return Math.min(times * 1000, 5000);
    },

    keepAlive: 30000,
    noDelay: true,
  });
};

const redisClient = createRedisClient();

// Event handlers
let connectionStatus = false;
let connectingPromise: Promise<void> | null = null; // ✅ prevents race condition on concurrent connect calls

/**
 * @param client
 * Sets up event handlers for the Redis client to monitor connection status.
 */
const setupEventHandlers = (client: Redis): void => {
  client.on("error", (err: Error) => {
    console.error("Redis Client Error:", err);
    connectionStatus = false;
    connectingPromise = null; // ✅ reset lock on error
  });

  client.on("connect", () => {
    console.log("Redis client connected");
    connectionStatus = true;
  });

  client.on("close", () => {
    console.log("Redis client disconnected");
    connectionStatus = false;
    connectingPromise = null; // ✅ reset lock on close
  });

  client.on("ready", () => {
    console.log("Redis client ready");
    connectionStatus = true;
  });
};

setupEventHandlers(redisClient);

// Check connection status
const isConnected = (): boolean => connectionStatus;

// Connect function
const connect = async (): Promise<void> => {
  if (isConnected()) return;

  // ✅ if already connecting, wait for that promise instead of calling connect() again
  if (connectingPromise) return connectingPromise;

  connectingPromise = (async () => {
    try {
      await redisClient.connect();
      connectionStatus = true;
      console.log("Connected to Redis");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    } finally {
      connectingPromise = null; // ✅ always release lock
    }
  })();

  return connectingPromise;
};

// Ensure connected
const ensureConnected = async (): Promise<void> => {
  if (!isConnected()) {
    await connect();
  }
};

// Disconnect function
const disconnect = async (): Promise<void> => {
  if (isConnected()) {
    await redisClient.quit();
    connectionStatus = false;
  }
};

// Health check
const healthCheck = async (): Promise<boolean> => {
  try {
    await ensureConnected();
    const result = await redisClient.ping();
    return result === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
};

// Set key with expiration
const set = async (
  key: string,
  value: string,
  expiryInSec: number = 3600,
): Promise<void> => {
  try {
    await ensureConnected();
    await redisClient.setex(key, expiryInSec, value);
  } catch (err) {
    console.error(`Error setting key ${key}:`, err);
    throw err;
  }
};

// Get key
const get = async (key: string): Promise<string | null> => {
  try {
    await ensureConnected();
    const result = await redisClient.get(key);
    return result;
  } catch (err) {
    console.error(`Error getting key ${key}:`, err);
    throw err;
  }
};

// Delete key
const del = async (key: string): Promise<void> => {
  try {
    await ensureConnected();
    await redisClient.del(key);
  } catch (err) {
    console.error(`Error deleting key ${key}:`, err);
    throw err;
  }
};

// Get keys by pattern
const keys = async (pattern: string): Promise<string[]> => {
  try {
    await ensureConnected();
    return await redisClient.keys(pattern);
  } catch (err) {
    console.error(`Error getting keys with pattern ${pattern}:`, err);
    throw err;
  }
};

// Pipeline operations
const pipeline = () => redisClient.pipeline();

// Export all functions as an object
const redisOperations = {
  client: redisClient,
  connect,
  disconnect,
  ensureConnected,
  healthCheck,
  set,
  get,
  del,
  keys,
  pipeline,
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnect();
  process.exit(0);
});

export default redisOperations;