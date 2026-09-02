import type { RouteGenericInterface } from "fastify";

type Word = `${string}`;
type DottedString = `${Word}.${Word}`;
type Path = `${Word}.${DottedString}`;

declare module "fastify" {
  interface FastifyInstance {
    env: {
      SESSION_SECRET: string;
      PORT: number;
    };
  }

  interface FastifyContextConfig {
    cacheKey?: CacheKeys;
    cacheTTL?: number;
    dynamic?: boolean;
    dynamicCacheProps?: [string, DottedString][];
  }

  interface FastifyReply {
    locals?: {
      cacheKey?: string;
      [key: string]: any;
    };
    view(
      page: "index" | "404" | (string & {}),
      data?: object,
      opts?: RouteSpecificOptions,
    ): FastifyReply;
  }

  /**
   * Custom version of the {@link RouteGenericInterface} interface.
   */
  interface FastifyRouteGenerics<
    Reply = ReplyDefault,
    Body = RequestBodyDefault,
    Params = RequestParamsDefault,
    Querystring = RequestQuerystringDefault,
    Headers = RequestHeadersDefault,
  > extends RouteGenericInterface {
    Reply: Reply;
    Body: Body;
    Params: Params;
    Querystring: Querystring;
    Headers: Headers;
  }
}

declare module "@fastify/secure-session" {
  interface SessionData {
    user: Shop.ServerUserInfo;
  }
}

export {};
