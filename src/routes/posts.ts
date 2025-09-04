import {
  getCachedValue,
  readLocalJsonFile,
  saveToCache,
  waitFor
} from "@/utils/tools";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
// validation
import z from "zod";
// caching
import { createCache } from "cache-manager";
import { CACHE } from "@/utils/configuration";

const memCache = createCache({
  ttl: CACHE.TTL,
  refreshThreshold: CACHE.refreshThreshold(),
});

export const postsRoutes = async (app: FastifyInstance) => {
  app.get("/", async (_req: FastifyRequest, _res: FastifyReply) => {
    const cacheKey = "posts";
    const cachedValue = (await getCachedValue(
      memCache,
      cacheKey,
      _req
    )) as Database.PostInfoType[];

    if (cachedValue) {
      _res.status(200).send(cachedValue);
      return;
    }

    await waitFor(2000);

    const posts = await readLocalJsonFile("public/db/posts.json");
    _res.send(posts);
    saveToCache(memCache, cacheKey, posts, _req);
  });

  app.get("/:id", async (_req: FastifyRequest, _res: FastifyReply) => {
    const id = +(_req.params as { id: string }).id;

    _req.log.info(`postId: ${id}`);

    const validationResult = z.number().min(1).max(100).safeParse(id);

    if (!validationResult.success) {
      throw new Error(validationResult.error.issues[0]?.message);
    }
    const cacheKey = `posts/${id}`;
    const cachedValue = (await getCachedValue(
      memCache,
      cacheKey,
      _req
    )) as Database.PostInfoType;

    if (cachedValue) {
      _res.status(200).send(cachedValue);
      return;
    }

    await waitFor(2000);

    const post = (
      (await readLocalJsonFile(
        "public/db/posts.json"
      )) as Database.PostInfoType[]
    ).find((post) => post.id === id);

    _res.send(post);
    saveToCache(memCache, cacheKey, post, _req);
  });
};
