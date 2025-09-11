import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  getCachedValue,
  readPosts,
  readUsers,
  saveToCache,
  waitFor,
} from "@/utils/tools";
import { MODE } from "@/utils/configuration";
// validation
import z from "zod";
// caching
import { memCache } from "@/utils/cache";

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

    if (MODE === "development") {
      await waitFor(2000);
    }

    const users = await readUsers();
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

    if (MODE === "development") {
      await waitFor(2000);
    }

    const user = (await readUsers()).find((user) => user.id === id);

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

    if (MODE === "development") {
      await waitFor(2000);
    }

    const posts = (await readPosts()).filter((post) => post.userId === id);

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

      if (MODE === "development") {
        await waitFor(2000);
      }

      const post = (await readPosts()).find((post) => post.id === actualPostId);

      _res.send(post);
      saveToCache(memCache, cacheKey, post, _req);
    }
  );
};
