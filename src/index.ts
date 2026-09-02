// --- Fastify ecosystem imports ---
import fastify, { LogController, type FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import { fastifySecureSession } from "@fastify/secure-session"; // you can use @fastify/secure-session for Encrypted Session Storage
import fastifyEnv from "@fastify/env";
// --- Other imports ---
import ejs from "ejs";
import path from "path";
// --- Local imports ---
import { getPinoConfig } from "@/utils/pino-config";
import {
  CORS_OPTIONS,
  ENV_OPTIONS,
  MODE,
  SESSION_OPTIONS,
} from "@/utils/config";
// --- Routes imports ---
import { appRoutes } from "@/routes";

const logController = new LogController({
  disableRequestLogging: true,
});

const app: FastifyInstance = fastify({
  logController,
  logger: getPinoConfig(MODE),
  trustProxy: true,
});

// Register fastify env first
app.register(fastifyEnv, ENV_OPTIONS);

// --- Config registration ---
app.after(() => {
  app.register(fastifyCookie);
  app.register(fastifySecureSession, SESSION_OPTIONS);
  app.register(cors, CORS_OPTIONS);

  app.register(fastifyView, {
    engine: { ejs },
    root: path.join(process.cwd(), "views"),
  });

  app.register(fastifyStatic, {
    root: path.join(process.cwd(), "public"),
  });
});

if (import.meta.env.DEV) {
  app.register((await import("@/hooks/logger")).loggerHooks);
}

// --- App routes registration ---
app.register(appRoutes, { prefix: "/api" });

app.setNotFoundHandler((_req, _res) => {
  if (import.meta.env.DEV) {
    _req.log.warn(
      `\x1b[35m\x1b[1m${_req.method}\x1b[39m\x1b[22m \x1b[31m${_req.url}\x1b[39m | Not Found`,
    );
  }
  return _res.code(404).view("404", { pathname: _req.url });
});

if (process.env.VERCEL !== "1" && import.meta.env.PROD) {
  (async () => {
    await app.ready();

    app.listen(
      {
        port: app.env.PORT,
      },
      (err, address) => {
        import("vite").then((ctx) => {
          const logger = ctx.createLogger("info", {
            allowClearScreen: true,
          });

          if (err) {
            logger.error(err.message, { error: err, timestamp: true });
            process.exit(1);
          } else {
            logger.info(
              `\x1b[30mfastify running at\x1b[39m [\x1b[36m\x1b[1m ${address} \x1b[39m]`,
              // { clear: true, timestamp: true },
            );
          }
        });
      },
    );
  })();
}

export const viteNodeApp = app; // for vite-plugin-node
// export default app; // for vercel deployment

// for vercel deployment
export default function handler(req: any, res: any) {
  app.ready((err) => {
    if (err) {
      res.statusCode = 500;
      res.end("Server not ready");
      return;
    }
    app.server.emit("request", req, res);
  });
}
