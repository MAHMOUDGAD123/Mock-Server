import type { FastifyInstance } from "fastify";
import { Innertube } from "youtubei.js";
import ytpl from "@distube/ytpl";

export const youtubeRoutes = async (app: FastifyInstance) => {
  app.get<{
    Querystring: { videoID: string };
  }>(
    "/youtubei",
    {
      config: {
        cacheKey: "[videoID]",
        dynamic: true,
        dynamicCacheProps: [["videoID", "query.videoID"]],
      },
    },
    async (_req, _res) => {
      const videoID = _req.query.videoID;
      const youtube = await Innertube.create();
      const videoData = await youtube.getBasicInfo(videoID);
      return _res.send(videoData);
    }
  );

  app.get<{
    Querystring: { listUrl: string };
  }>(
    "/ytpl",
    {
      config: {
        cacheKey: "[listUrl]",
        dynamic: true,
        dynamicCacheProps: [["listUrl", "query.listUrl"]],
      },
    },
    async (_req, _res) => {
      const { listUrl } = _req.query;
      const data = await ytpl(listUrl);
      return _res.send(data);
    }
  );
};
