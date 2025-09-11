import type { FastifyCorsOptions } from "@fastify/cors";
import type { FastifySessionOptions } from "@fastify/session";
import type { FastifyEnvOptions } from "@fastify/env";
import { randomBytes } from "crypto";

export const MODE = import.meta.env.MODE as Globals.EnvironmentMode;

export const COOKIE_SECRET = randomBytes(32).toString("hex");
export const COOKIE_LIFE = 3 * 60 * 1000; // 3 minutes by default

export const SESSION_OPTIONS: FastifySessionOptions = {
  secret: COOKIE_SECRET,
  saveUninitialized: false,
  cookie: {
    path: "/",
    secure: false,
    maxAge: COOKIE_LIFE,
  },
};

export const CORS_OPTIONS: FastifyCorsOptions = {
  origin: [
    // /https:\/\/.+\.netlify\.app/, // PROD (your website)
    /http:\/\/localhost:\d{4}/, // DEV
  ],
  credentials: true,
  methods: ["GET", "POST"],
  optionsSuccessStatus: 200,
};

export const ENV_OPTIONS: FastifyEnvOptions = {
  confKey: "env", // Access variables via `app.config`
  dotenv: true, // Load from `.env` file automatically
  schema: {
    type: "object",
    required: ["PORT"],
    properties: {
      PORT: {
        type: "integer",
        default: 3000,
      },
    },
  },
};
