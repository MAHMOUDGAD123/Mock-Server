import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyRouteGenerics,
} from "fastify";
import { shopAuthHook } from "@/hooks/auth";

type LanguageRouteGeneric = FastifyRouteGenerics<
  Globals.ReplaySchema<Shop.ServerUserInfo>,
  Shop.LanguageRequestBody
>;

type LanguageRequest = FastifyRequest<LanguageRouteGeneric>;
type LanguageResponse = FastifyReply<LanguageRouteGeneric>;

type FilterRouteGeneric = FastifyRouteGenerics<
  Globals.ReplaySchema<Shop.ServerUserInfo>,
  Shop.FilterRequestBody
>;

type FilterRequest = FastifyRequest<FilterRouteGeneric>;
type FilterResponse = FastifyReply<FilterRouteGeneric>;

const checkLangRequestBodyHook = async (
  _req: LanguageRequest,
  _res: LanguageResponse,
) => {
  if (!_req.body?.lang) {
    return _res.status(400).send({
      status: "Bad Request",
      message: "Sorry, request body is missing the (lang) property 🔴",
    });
  }

  const validLanguages: Shop.Language[] = ["ar", "en"];

  const lang = _req.body.lang.toLowerCase() as Shop.Language;
  if (!validLanguages.includes(lang)) {
    if (import.meta.env.DEV) {
      const logger = (await import("@/utils/logger")).createLogger({
        tag: "LANGUAGE",
      });
      logger.error(`Invalid language (${lang}).`);
      logger.line();
    }

    return _res.status(400).send({
      status: "Bad Request",
      message: `Sorry, (${lang}) isn't a valid language 🔴`,
    });
  }
};

const checkFilterRequestBodyHook = async (
  _req: FilterRequest,
  _res: FilterResponse,
) => {
  if (!_req.body?.filter) {
    return _res.status(400).send({
      status: "Bad Request",
      message: "Sorry, request body is missing the (filter) property 🔴",
    });
  }

  const validFilters: Shop.CategoryFilter[] = [
    "all",
    "best",
    "coffee",
    "equipment",
    "offer",
    "roasting",
  ];

  const filter = _req.body.filter.toLowerCase() as Shop.CategoryFilter;
  if (!validFilters.includes(filter)) {
    if (import.meta.env.DEV) {
      const logger = (await import("@/utils/logger")).createLogger({
        tag: "FILTER",
      });
      logger.error(`Invalid filter (${filter}).`);
      logger.line();
    }

    return _res.status(400).send({
      status: "Bad Request",
      message: `Sorry, (${filter}) isn't a valid filter 🔴`,
    });
  }
};

export const shopPreferencesRoutes = (app: FastifyInstance) => {
  app.addHook("preHandler", shopAuthHook);

  app.post<LanguageRouteGeneric>(
    "/language",
    { preHandler: checkLangRequestBodyHook },
    async (_req, _res) => {
      const lang = _req.body.lang.toLowerCase() as Shop.Language;
      const userData = _req.session.get("user")!;

      const newUserData: Shop.ServerUserInfo = {
        ...userData,
        language: lang,
      };

      _req.session.set("user", newUserData);

      return _res.status(201).send({
        status: "Language Updated",
        message: `Language updated to (${lang}).`,
        data: newUserData,
      });
    },
  );

  app.post<FilterRouteGeneric>(
    "/filter",
    { preHandler: checkFilterRequestBodyHook },
    async (_req, _res) => {
      const filter = _req.body.filter.toLowerCase() as Shop.CategoryFilter;
      const userData = _req.session.get("user")!;

      const newUserData: Shop.ServerUserInfo = {
        ...userData,
        filter,
      };

      _req.session.set("user", newUserData);

      return _res.status(201).send({
        status: "Filter Updated",
        message: `Filter updated to (${filter}).`,
        data: newUserData,
      });
    },
  );
};
