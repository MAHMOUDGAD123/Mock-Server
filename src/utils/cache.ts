import { createCache } from "cache-manager";

const CACHE_TTL = 60 * 1000; // 1 minutes by default

const CACHE: { TTL: number; refreshThreshold: () => number } = {
  TTL: CACHE_TTL,
  refreshThreshold: () => {
    // to update the cache 10 seconds before outdated
    const threshold = 10000;
    return CACHE_TTL - threshold < 0 ? 0 : threshold;
  },
};

export const memCache = createCache({
  ttl: CACHE.TTL,
  refreshThreshold: CACHE.refreshThreshold(),
});
