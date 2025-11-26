import { getCache, setCache, deleteCache, invalidateByPattern } from "../../shared/redis/cacheService";

// Cache key constants
const CACHE_PREFIX = "adminVerification";
const CACHE_TTL = 3600; // 1 hour in seconds

// Helper function to generate cache keys
const getCacheKey = {
  byUser: (userId: string) => `${CACHE_PREFIX}:user:${userId}`,
  byId: (verificationId: string) => `${CACHE_PREFIX}:id:${verificationId}`,
  statusByUser: (userId: string) => `${CACHE_PREFIX}:status:${userId}`,
};

// Helper function to invalidate user's verification cache
const invalidateUserCache = async (userId: string): Promise<void> => {
  try {
    // Delete specific user cache
    await deleteCache(getCacheKey.byUser(userId));
    // Delete user status cache
    await deleteCache(getCacheKey.statusByUser(userId));
    // Invalidate any related patterns
    await invalidateByPattern(`${CACHE_PREFIX}:*${userId}*`);
  } catch (error) {
    console.error(`Error invalidating verification cache for user ${userId}:`, error);
    // Don't throw error - cache invalidation failure shouldn't break the operation
  }
};

// Helper function to invalidate verification by ID
const invalidateVerificationCache = async (verificationId: string): Promise<void> => {
  try {
    await deleteCache(getCacheKey.byId(verificationId));
  } catch (error) {
    console.error(`Error invalidating verification cache for id ${verificationId}:`, error);
  }
};

export const adminVerificationCache = {
  getCache,
  setCache,
  deleteCache,
  invalidateByPattern,
  getCacheKey,
  invalidateUserCache,
  invalidateVerificationCache,
  CACHE_TTL,
};
