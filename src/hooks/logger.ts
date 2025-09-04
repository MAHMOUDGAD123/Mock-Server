import fp from "fastify-plugin";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyError,
} from "fastify";

export const loggerHooks = fp(async (app: FastifyInstance) => {
  app.addHook("onRequest", async (_req: FastifyRequest, _res: FastifyReply) => {
    console.clear();
  });

  app.addHook(
    "onResponse",
    async (_req: FastifyRequest, _res: FastifyReply) => {
      _req.log.info(
        `${_req.id} \x1b[35m\x1b[1m${_req.method}\x1b[39m\x1b[22m \x1b[33m${
          _req.url
        }\x1b[39m >> \x1b[1m\x1b[38m${
          _res.statusCode
        }\x1b[39m\x1b[22m \x1b[30m(${_res.elapsedTime.toFixed(3)}ms)\x1b[39m`
      );
    }
  );

  app.addHook(
    "onError",
    async (_req: FastifyRequest, _res: FastifyReply, error: FastifyError) => {
      _req.log.error(`\x1b[30m${error.message}`);
    }
  );
});
