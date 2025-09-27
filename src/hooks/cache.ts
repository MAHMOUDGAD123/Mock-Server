import type { FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { getCachedValue, memCache, saveToCache } from "@/utils/cache";

// Register cache hooks as plugin
export const cacheHooks = fp((app: FastifyInstance) => {
  app.addHook("preHandler", async (_req, _res) => {
    const config = _req.routeOptions.config;
    let cacheKey = config.cacheKey;

    if (!cacheKey) return;
    if (config.dynamic && config.dynamicCacheProps) {
      config.dynamicCacheProps.forEach(([prop, path]) => {
        let propValue = _req as unknown;
        const pathArray = path.split(".");
        pathArray.forEach((propKey) => {
          // @ts-ignore
          propValue = propValue[propKey];
        });
        cacheKey = cacheKey!.replace(`[${prop}]`, `${propValue}`);
      });
    }

    const cachedValue = await getCachedValue(memCache, cacheKey);
    if (cachedValue) {
      // short‑circuit response if cached
      _res.send(cachedValue);
      _req.log.info(`${cacheKey} \x1b[32m\x1b[1m[Served From Cache]`);
      return;
    }

    // to use later by 'onSend' hook
    _res.locals = { cacheKey };
  });

  app.addHook("onSend", async (_req, _res, payload) => {
    const cacheKey = _res?.locals?.cacheKey;
    if (!cacheKey) return payload;

    try {
      // Save only if status is successful
      if (_res.statusCode >= 200 && _res.statusCode < 300) {
        await saveToCache(memCache, cacheKey, payload);
        _req.log.info(`${cacheKey} \x1b[30m[Served From db]`);
      }
    } catch (err) {
      _req.log.error({ err }, `Failed to cache ${cacheKey}`);
    }

    return payload;
  });
});
