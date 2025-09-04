import {
  getCachedValue,
  readLocalJsonFile,
  saveToCache,
  waitFor,
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

export const usersRoutes = async (app: FastifyInstance) => {
  app.get("/", async (_req: FastifyRequest, _res: FastifyReply) => {
    const cacheKey = "users";
    const cachedValue = (await getCachedValue(
      memCache,
      cacheKey,
      _req
    )) as Database.UserInfoType[];

    if (cachedValue) {
      _res.status(200).send(cachedValue);
      return;
    }

    await waitFor(2000);

    const users = await readLocalJsonFile("public/db/users.json");
    _res.send(users);
    saveToCache(memCache, cacheKey, users, _req);
  });

  app.get("/:id", async (_req: FastifyRequest, _res: FastifyReply) => {
    const id = +(_req.params as { id: string }).id;

    _req.log.info(`userId: ${id}`);

    const validationResult = z.number().min(1).max(10).safeParse(id);

    if (!validationResult.success) {
      throw new Error(validationResult.error.issues[0]?.message);
    }
    const cacheKey = `users/${id}`;
    const cachedValue = (await getCachedValue(
      memCache,
      cacheKey,
      _req
    )) as Database.UserInfoType;

    if (cachedValue) {
      _res.status(200).send(cachedValue);
      return;
    }

    await waitFor(2000);

    const user = (
      (await readLocalJsonFile(
        "public/db/users.json"
      )) as Database.UserInfoType[]
    ).find((user) => user.id === id);

    _res.send(user);
    saveToCache(memCache, cacheKey, user, _req);
  });

  app.get("/:id/posts", async (_req: FastifyRequest, _res: FastifyReply) => {
    const id = +(_req.params as { id: string }).id;

    _req.log.info(`userId: ${id}`);

    const validationResult = z.number().min(1).max(10).safeParse(id);

    if (!validationResult.success) {
      throw new Error(validationResult.error.issues[0]?.message);
    }
    const cacheKey = `users/${id}/*`;
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

    const posts = (
      (await readLocalJsonFile(
        "public/db/posts.json"
      )) as Database.PostInfoType[]
    ).filter((post) => post.userId === id);

    _res.send(posts);
    saveToCache(memCache, cacheKey, posts, _req);
  });

  app.get(
    "/:userId/posts/:postId",
    async (_req: FastifyRequest, _res: FastifyReply) => {
      const ids = _req.params as { userId: string; postId: string };
      const userId = +ids.userId;
      const postId = +ids.postId;

      _req.log.info(`userId: ${userId} - postId: ${postId}`);

      const { userIdValidation, postIdValidation } = {
        userIdValidation: z.number().min(1).max(10).safeParse(userId),
        postIdValidation: z.number().min(1).max(10).safeParse(postId),
      };

      if (!userIdValidation.success || !postIdValidation.success) {
        const errMsg = [
          userIdValidation.error?.issues[0]?.message,
          postIdValidation.error?.issues[0]?.message,
        ]
          .filter((msg) => msg)
          .join(" | ");
        throw new Error(errMsg);
      }
      const cacheKey = `users/${userId}/${postId}`;
      const cachedValue = (await getCachedValue(
        memCache,
        cacheKey,
        _req
      )) as Database.UserInfoType;

      if (cachedValue) {
        _res.status(200).send(cachedValue);
        return;
      }

      const actualPostId = (userId - 1) * 10 + postId;

      await waitFor(2000);

      const post = (
        (await readLocalJsonFile(
          "public/db/posts.json"
        )) as Database.PostInfoType[]
      ).find((post) => post.id === actualPostId);

      _res.send(post);
      saveToCache(memCache, cacheKey, post, _req);
    }
  );
};
