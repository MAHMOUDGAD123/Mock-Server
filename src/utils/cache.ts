import { createCache, type Cache } from "cache-manager";

const CACHE_TTL = 60 * 1000; // 1 minutes by default

const threshold = () => {
  // to update the cache 10 seconds before outdated
  const threshold = 10000;
  return CACHE_TTL - threshold < 0 ? 0 : threshold;
};

export const memCache = createCache({
  ttl: CACHE_TTL,
  refreshThreshold: threshold(),
});

export const getCachedValue = async (memCache: Cache, cacheKey: string) => {
  const cachedValue = await memCache.get(cacheKey);

  if (cachedValue) {
    return cachedValue;
  }
  return null;
};

export const saveToCache = async (
  memCache: Cache,
  cacheKey: string,
  dataToSave: unknown
) => {
  memCache.set(cacheKey, dataToSave);
};
