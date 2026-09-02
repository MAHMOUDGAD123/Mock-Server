import type { FastifyCorsOptions } from "@fastify/cors";
import type { SecureSessionPluginOptions } from "@fastify/secure-session";
import type { FastifyEnvOptions } from "@fastify/env";

export const MODE = import.meta.env.MODE as Globals.EnvironmentMode;

const PROD_SESSION_SECRET_HEX = process.env.SESSION_SECRET;
const DEV_SESSION_SECRET_HEX =
  "87ef5ed39d498e2a34928e525c920197b30fbe45099a4f0e4f4d700ee1826495";
const SESSION_SECRET_HEX = PROD_SESSION_SECRET_HEX || DEV_SESSION_SECRET_HEX;
const SECRET_BUFFER = Buffer.from(SESSION_SECRET_HEX, "hex");
const COOKIE_LIFE = 60 * 60; // 1 hour

export const SESSION_OPTIONS: SecureSessionPluginOptions = {
  key: SECRET_BUFFER,
  secret: SESSION_SECRET_HEX,
  cookie: {
    // httpOnly prevents JS from reading the cookie (XSS protection)
    httpOnly: true,
    // 'lax' allows links to your site to send cookies, 'strict' is safer but harder to use
    sameSite: "lax",
    path: "/",
    // Only send over HTTPS in production
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    maxAge: COOKIE_LIFE,
  },
};

export const CORS_OPTIONS: FastifyCorsOptions = {
  origin: [
    // /https:\/\/.+\.netlify\.app/, // PROD (your website)
    // /https:\/\/.+\.vercel\.app/, // Allow Vercel preview URLs
    /http:\/\/localhost:\d{4}/, // DEV
  ],
  credentials: true, // Required for cookies to work with CORS
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Usually you need more than GET/POST
  optionsSuccessStatus: 200,
};

export const ENV_OPTIONS: FastifyEnvOptions = {
  confKey: "env", // Access variables via `app.config`
  dotenv: true, // Load from `.env` file automatically
  schema: {
    type: "object",
    required: ["SESSION_SECRET"],
    properties: {
      PORT: { type: "integer", default: 3000 },
      SESSION_SECRET: { type: "string", minLength: 64 }, // Ensure hex string length
    },
  },
};
