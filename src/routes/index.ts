import type { FastifyInstance } from "fastify";
import { usersRoutes } from "@/routes/users";
import { postsRoutes } from "@/routes/posts";
import { youtubeRoutes } from "@/routes/youtubei";
import { shopRoutes } from "@/routes/shop";
import { cacheRoutes } from "@/routes/cache";

export const appRoutes = async (app: FastifyInstance) => {
  app.get("/", async (_req, _res) => {
    return _res.view("index");
  });

  app.register(shopRoutes, { prefix: "/shop" });
  app.register(usersRoutes, { prefix: "/users" });
  app.register(postsRoutes, { prefix: "/posts" });
  app.register(youtubeRoutes, { prefix: "/youtube" });
  app.register(cacheRoutes, { prefix: "/cache" });
};
