import { memCache } from "@/utils/cache";
import type { FastifyInstance } from "fastify";

export const cacheRoutes = async (app: FastifyInstance) => {
  app.post<{
    Reply: Globals.ReplaySchema;
  }>("/clear", async (_req, _res) => {
    const done = await memCache.clear();

    if (!done) {
      _res.status(500).send({
        status: "Failed",
        message: "Failed to clear the API cache.",
      });
    }

    _res.status(200).send({
      status: "Cache Cleared",
      message: "API cache cleared successfully.",
    });
  });
};
