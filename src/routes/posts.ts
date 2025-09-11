import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getCachedValue, readPosts, saveToCache, waitFor } from "@/utils/tools";
import { MODE } from "@/utils/configuration";
// validation
import z from "zod";
// caching
import { memCache } from "@/utils/cache";

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

    if (MODE === "development") {
      await waitFor(2000);
    }

    const posts = await readPosts();
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

    if (MODE === "development") {
      await waitFor(2000);
    }

    const post = (await readPosts()).find((post) => post.id === id);

    _res.send(post);
    saveToCache(memCache, cacheKey, post, _req);
  });
};
