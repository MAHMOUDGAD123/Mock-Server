// fastify ecosystem imports
import fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyView from "@fastify/view";
import cors from "@fastify/cors";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session"; // you can use @fastify/secure-session for Encrypted Session Storage
import fastifyEnv from "@fastify/env";
// other imports
import ejs from "ejs";
import path from "path";
// local imports
import { getPinoConfig } from "@/utils/tools";
import { loggerHooks } from "@/hooks/logger";
import { usersRoutes } from "@/routes/users";
import {
  CORS_OPTIONS,
  ENV_OPTIONS,
  SESSION_OPTIONS,
} from "./utils/configuration";
import { postsRoutes } from "./routes/posts";

const MODE = import.meta.env.MODE as Globals.EnvironmentMode;

const app: FastifyInstance = fastify({
  disableRequestLogging: true,
  logger: getPinoConfig(MODE),
});

app.register(fastifyEnv, ENV_OPTIONS);
app.register(fastifyCookie);
app.register(fastifySession, SESSION_OPTIONS);
app.register(cors, CORS_OPTIONS);

app.register(fastifyView, {
  engine: { ejs },
  root: path.resolve(import.meta.dirname, "../views"),
});

app.register(fastifyStatic, {
  root: path.resolve(import.meta.dirname, "../public"),
});

if (import.meta.env.DEV) {
  app.register(loggerHooks);
}

app.register(usersRoutes, { prefix: "/api/users" });
app.register(postsRoutes, { prefix: "/api/posts" });

app.get("/", async (_req: FastifyRequest, _res: FastifyReply) => {
  return _res.view("index");
});

app.get("/api", async (_req: FastifyRequest, _res: FastifyReply) => {
  return _res.view("index");
});

app.setNotFoundHandler((_req, _res) => {
  _req.log.warn(
    `\x1b[35m\x1b[1m${_req.method}\x1b[39m\x1b[22m \x1b[31m${_req.url}\x1b[39m | Not Found`
  );
  return _res.code(404).view("404", { pathname: _req.url });
});

if (MODE === "production" && !process.env.VERCEL) {
  (async () => {
    app.listen(
      {
        port: +process.env.PORT! || 3000,
      },
      (err, address) => {
        if (err) {
          app.log.error(err.message);
          process.exit(1);
        } else {
          console.clear();
          console.log(
            `\x1b[30mfastify running at\x1b[39m [\x1b[36m\x1b[1m ${address} \x1b[39m]`
          );
        }
      }
    );
  })();
}

export const viteNodeApp = app; // for vite-plugin-node
export default app; // for vercel deployment
