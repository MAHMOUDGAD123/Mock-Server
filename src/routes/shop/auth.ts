import { shopAuthHook } from "@/hooks/auth";
import type { FastifyInstance, FastifyRouteGenerics } from "fastify";

type AuthRouteGenerics = FastifyRouteGenerics<
  Globals.ReplaySchema<Shop.ServerUserInfo>
>;

export const shopAuthRoutes = async (app: FastifyInstance) => {
  app.post<AuthRouteGenerics>("/signup", async (_req, _res) => {
    const userData = _req.session.get("user");

    if (userData) {
      return _res.status(201).send({
        status: "Signed Up",
        message: "You are already signed up.",
        data: userData,
      });
    }

    const newUserData: Shop.ServerUserInfo = {
      filter: "all",
      language: "en",
      cart: {},
    };

    _req.session.set("user", newUserData);

    return _res.status(201).send({
      status: "Signed Up",
      message: "Welcome back.",
      data: newUserData,
    });
  });

  app.get<AuthRouteGenerics>(
    "/profile",
    { preHandler: shopAuthHook },
    async (_req, _res) => {
      const userData = _req.session.get("user");

      return _res.status(200).send({
        status: "Authorized",
        message: "You're still here.",
        data: userData,
      });
    },
  );

  app.post<AuthRouteGenerics>(
    "/logout",
    { preHandler: shopAuthHook },
    async (_req, _res) => {
      _req.session.delete();

      return _res.status(200).send({
        status: "Logged Out",
        message: "Session cleared successfully.",
      });
    },
  );
};
