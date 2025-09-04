import type { Cache } from "cache-manager";
import { PINO_CONFIG } from "./pino-config";
import type { FastifyRequest } from "fastify";
import { promises as fs } from "fs";
import path from "path";

export const getPinoConfig = (mode: "development" | "production") => {
  return PINO_CONFIG[mode];
};

/**
 * @param ms number of milliseconds
 */
export const waitFor = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const readLocalJsonFile = async (path: string) => {
  return JSON.parse(await fs.readFile(path, "utf-8"));
};

export const readUsers = () => {
  return readLocalJsonFile(
    path.join(process.cwd(), "public/db/users.json")
  ) as Promise<Database.UserInfoType[]>;
};
export const readPosts = () => {
  return readLocalJsonFile(
    path.join(process.cwd(), "public/db/posts.json")
  ) as Promise<Database.PostInfoType[]>;
};

export const readJsonFile = async (relativePath: string) => {
  return JSON.parse(await fs.readFile(path.join(process.cwd(), relativePath), "utf-8"));
};

// Caching
// =============================================================
export const getCachedValue = async (
  memCache: Cache,
  cacheKey: string,
  request: FastifyRequest
) => {
  const cachedValue = await memCache.get(cacheKey);

  if (cachedValue) {
    request.log.info("\x1b[32m\x1b[1m[Served From Cache]");
    return cachedValue;
  }
  return null;
};

export const saveToCache = async (
  memCache: Cache,
  cacheKey: string,
  dataToSave: unknown,
  request: FastifyRequest
) => {
  memCache.set(cacheKey, dataToSave);
  request.log.info("\x1b[30m[Served From db]");
};
// =============================================================
