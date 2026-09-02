import { fastifyPlugin as fp } from "fastify-plugin";
import type { FastifyInstance } from "fastify";

export const loggerHooks = fp(async (app: FastifyInstance) => {
  const { createLogger } = await import("@/utils/logger");

  app.addHook("onRequest", async (_req, _res) => {
    const logger = createLogger({ tag: "SESSION" });
    logger.clear();
  });

  app.addHook("onSend", async (_req, _res) => {
    const logger = createLogger({ tag: "SESSION" });
    logger.info(_req.session.data());
    logger.line();

    _req.log.info(
      `${_req.id} \x1b[35m\x1b[1m${_req.method}\x1b[39m\x1b[22m \x1b[33m${
        _req.url
      }\x1b[39m >> \x1b[1m\x1b[38m${
        _res.statusCode
      }\x1b[39m\x1b[22m \x1b[30m(${_res.elapsedTime.toFixed(3)}ms)\x1b[39m`,
    );
  });

  app.addHook("onError", async (_req, _res, error) => {
    _req.log.error(`\x1b[30m${error.message}`);
  });
});
