import type { FastifyReply, FastifyRequest } from "fastify";

export const shopAuthHook = async (
  _req: FastifyRequest,
  _res: FastifyReply,
) => {
  const userData = _req.session.get("user");

  if (!userData) {
    if (import.meta.env.DEV) {
      const logger = (await import("@/utils/logger")).createLogger({
        tag: "Auth",
      });
      logger.error("Unauthorized");
      logger.line();
    }

    return _res.status(401).send({
      status: "Unauthorized",
      message: "Sorry, you don't have a session yet 🔴",
    });
  } else {
    if (import.meta.env.DEV) {
      const logger = (await import("@/utils/logger")).createLogger({
        tag: "Auth",
      });
      logger.success("Authorized");
      logger.line();
    }
  }
};
