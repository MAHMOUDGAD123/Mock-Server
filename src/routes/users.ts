import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { readPosts, readUsers } from "@/utils/tools";
// validation
import z from "zod";

export const usersRoutes = async (app: FastifyInstance) => {
  app.get<{
    Reply: Database.UserInfoType[];
  }>(
    "/",
    { config: { cacheKey: "users", dynamic: false } },
    async (_req: FastifyRequest, _res: FastifyReply) => {
      const users = await readUsers();
      return _res.send(users);
    }
  );

  app.get<{
    Params: { id: string };
    Reply: Database.UserInfoType;
  }>(
    "/:id",
    {
      config: {
        cacheKey: "users/[id]",
        dynamic: true,
        dynamicCacheProps: [["id", "params.id"]],
      },
    },
    async (_req, _res) => {
      const id = +_req.params.id;

      _req.log.info(`userId: ${id}`);

      const validationResult = z.number().min(1).max(10).safeParse(id);

      if (!validationResult.success) {
        throw new Error(validationResult.error.issues[0]?.message);
      }

      const user = (await readUsers()).find((user) => user.id === id);
      return _res.send(user);
    }
  );

  app.get<{
    Params: { id: string };
    Reply: Database.PostInfoType[];
  }>(
    "/:id/posts",
    {
      config: {
        cacheKey: "users/[id]/posts",
        dynamic: true,
        dynamicCacheProps: [["id", "params.id"]],
      },
    },
    async (_req, _res) => {
      const id = +_req.params.id;

      _req.log.info(`userId: ${id}`);

      const validationResult = z.number().min(1).max(10).safeParse(id);

      if (!validationResult.success) {
        throw new Error(validationResult.error.issues[0]?.message);
      }

      const posts = (await readPosts()).filter((post) => post.userId === id);
      return _res.send(posts);
    }
  );

  app.get<{
    Params: { userId: string; postId: string };
    Reply: Database.PostInfoType;
  }>(
    "/:userId/posts/:postId",
    {
      config: {
        cacheKey: "users/[userId]/posts/[postId]",
        dynamic: true,
        dynamicCacheProps: [
          ["userId", "params.userId"],
          ["postId", "params.postId"],
        ],
      },
    },
    async (_req, _res) => {
      const ids = _req.params;
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

      const actualPostId = (userId - 1) * 10 + postId;

      const post = (await readPosts()).find((post) => post.id === actualPostId);
      return _res.send(post);
    }
  );
};
