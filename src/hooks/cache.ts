import type {
  FastifyInstance,
  onSendAsyncHookHandler,
  preHandlerAsyncHookHandler,
} from "fastify";
import { fastifyPlugin as fp } from "fastify-plugin";
import { getCachedValue, memCache, saveToCache } from "@/utils/cache";

export const cachePreHandler: preHandlerAsyncHookHandler = async (
  _req,
  _res,
) => {
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

  if (import.meta.env.DEV) {
    const logger = (await import("@/utils/logger")).createLogger({
      tag: "CACHE",
    });
    logger.info(cacheKey);
    logger.line();
  }

  const cachedValue = await getCachedValue(memCache, cacheKey);

  if (cachedValue) {
    // Return the cached value if exists
    if (import.meta.env.DEV) {
      _req.log.info(`${cacheKey} \x1b[32m\x1b[1m[Served From Cache]`);
    }
    return _res.type("application/json").send(cachedValue);
  }

  // To use later by 'onSend' hook
  _res.locals = { cacheKey };
};

export const cacheOnSaveHandler: onSendAsyncHookHandler = async (
  _req,
  _res,
  payload,
) => {
  const cacheKey = _res?.locals?.cacheKey;
  const cacheTTL = _req.routeOptions.config.cacheTTL;
  if (!cacheKey) return payload;

  try {
    // Save only if status is successful
    if (_res.statusCode >= 200 && _res.statusCode < 300) {
      await saveToCache(memCache, cacheKey, payload, cacheTTL);
      if (import.meta.env.DEV) {
        _req.log.info(`${cacheKey} \x1b[30m[Served From db]`);
      }
    }
  } catch (err) {
    if (import.meta.env.DEV) {
      _req.log.error({ err }, `Failed to cache ${cacheKey}`);
    }
  }

  return payload;
};

// Register cache hooks as plugin
export const cacheHooks = fp(async (app: FastifyInstance) => {
  app.addHook("preHandler", cachePreHandler);
  app.addHook("onSend", cacheOnSaveHandler);
});
