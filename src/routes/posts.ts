import type { FastifyInstance } from "fastify";
import { readPosts } from "@/utils/tools";
// validation
import z from "zod";

export const postsRoutes = async (app: FastifyInstance) => {
  app.get<{
    Reply: Database.PostInfoType[];
  }>(
    "/",
    { config: { cacheKey: "posts", dynamic: false } },
    async (_req, _res) => {
      const posts = await readPosts();
      return _res.send(posts);
    }
  );

  app.get<{
    Params: {
      id: string;
    };
    Reply: Database.PostInfoType;
  }>(
    "/:id",
    {
      config: {
        cacheKey: "posts/[id]",
        dynamic: true,
        dynamicCacheProps: [["id", "params.id"]],
      },
    },
    async (_req, _res) => {
      const id = +_req.params.id;

      _req.log.info(`postId: ${id}`);

      const validationResult = z.number().min(1).max(100).safeParse(id);

      if (!validationResult.success) {
        throw new Error(validationResult.error.issues[0]?.message);
      }

      const post = (await readPosts()).find((post) => post.id === id);
      return _res.send(post);
    }
  );
};
