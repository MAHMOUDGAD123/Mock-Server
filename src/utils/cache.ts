import { createCache, type Cache } from "cache-manager";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hr

const threshold = () => {
  // to update the cache 10 seconds before outdated
  const threshold = 10000;
  return CACHE_TTL - threshold < 0 ? 0 : threshold;
};

export const memCache = createCache({
  ttl: CACHE_TTL,
  refreshThreshold: threshold(),
});

export const getCachedValue = async <T = unknown>(
  memCache: Cache,
  cacheKey: CacheKeys,
) => {
  const cachedValue = await memCache.get<T>(cacheKey);

  if (cachedValue) {
    return cachedValue;
  }
  return null;
};

export const saveToCache = async <T = unknown>(
  memCache: Cache,
  cacheKey: CacheKeys,
  dataToSave: T,
  ttl?: number,
) => {
  memCache.set<T>(cacheKey, dataToSave, ttl);
};
