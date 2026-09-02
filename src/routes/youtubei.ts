import type { FastifyInstance } from "fastify";
import { cacheHooks } from "@/hooks/cache";
import { Innertube } from "youtubei.js";
import ytpl from "@distube/ytpl";

export const youtubeRoutes = async (app: FastifyInstance) => {
  app.register(cacheHooks);

  app.get<{
    Querystring: { videoID: string };
  }>(
    "/youtubei",
    {
      config: {
        cacheKey: "yt/[videoID]",
        cacheTTL: 60 * 1000,
        dynamic: true,
        dynamicCacheProps: [["videoID", "query.videoID"]],
      },
    },
    async (_req, _res) => {
      const videoID = _req.query.videoID;
      const youtube = await Innertube.create();
      const videoData = await youtube.getStreamingData(videoID);
      return _res.send(videoData);
    },
  );

  app.get<{
    Querystring: { listUrl: string };
  }>(
    "/ytpl",
    {
      config: {
        cacheKey: "yt/[listUrl]",
        cacheTTL: 60 * 1000,
        dynamic: true,
        dynamicCacheProps: [["listUrl", "query.listUrl"]],
      },
    },
    async (_req, _res) => {
      const { listUrl } = _req.query;
      const data = await ytpl(listUrl);
      return _res.send(data);
    },
  );
};
