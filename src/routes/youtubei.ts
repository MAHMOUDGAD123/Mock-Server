import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { memCache } from "@/utils/cache";
import { getCachedValue, saveToCache } from "@/utils/tools";
import { Innertube } from "youtubei.js";
import ytpl from "@distube/ytpl";

export const youtubeRoutes = async (app: FastifyInstance) => {
  app.get(
    "/youtubei",
    async (
      _req: FastifyRequest<{ Querystring: { videoID: string } }>,
      _res: FastifyReply
    ) => {
      const { videoID } = _req.query;

      const cacheKey = videoID;
      const cachedValue = (await getCachedValue(
        memCache,
        cacheKey,
        _req
      )) as Database.UserInfoType[];

      if (cachedValue) {
        _res.status(200).send(cachedValue);
        return;
      }

      const youtube = await Innertube.create(); // Automatically fetches a valid YouTube client
      const videoData = await youtube.getBasicInfo(videoID); // Ex: 'dQw4w9WgXcQ'

      _res.send(videoData);
      saveToCache(memCache, cacheKey, videoData, _req);
    }
  );

  app.get(
    "/ytpl",
    async (
      _req: FastifyRequest<{ Querystring: { listUrl: string } }>,
      _res: FastifyReply
    ) => {
      const { listUrl } = _req.query;

      const cacheKey = listUrl;
      const cachedValue = (await getCachedValue(
        memCache,
        cacheKey,
        _req
      )) as Database.UserInfoType[];

      if (cachedValue) {
        _res.status(200).send(cachedValue);
        return;
      }

      const data = await ytpl(listUrl);

      _res.send(data);
      saveToCache(memCache, cacheKey, data, _req);
    }
  );
};
