import type { FastifyLoggerOptions, RawServerDefault } from "fastify";
import type { PinoLoggerOptions } from "fastify/types/logger";

export const PINO_CONFIG = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        singleLine: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname,reqId",
        colorize: true,
        messageFormat: "{msg}\x1b[0m",
      },
    },
    serializers: {
      req: (req) => {
        return {
          url: req.url,
          method: req.method,
        };
      },
      res: (res) => {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  },

  production: false,
} satisfies {
  development:
    | boolean
    | (FastifyLoggerOptions<RawServerDefault> & PinoLoggerOptions);
  production: boolean;
};

export const getPinoConfig = (mode: "development" | "production") => {
  return PINO_CONFIG[mode];
};
