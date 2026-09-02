import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  FastifyRouteGenerics,
} from "fastify";
import { shopAuthHook } from "@/hooks/auth";

type CartRouteGeneric = FastifyRouteGenerics<
  Globals.ReplaySchema<Shop.ServerUserInfo>,
  Shop.CartRequestBody
>;

type CartRequest = FastifyRequest<CartRouteGeneric>;
type CartResponse = FastifyReply<CartRouteGeneric>;

const checkRequestBodyHook = async (_req: CartRequest, _res: CartResponse) => {
  if (!_req.body?.productId) {
    return _res.status(400).send({
      status: "Bad Request",
      message: "Sorry, request body is missing the (productId) property.",
    });
  }
};

export const shopCartRoutes = async (app: FastifyInstance) => {
  app.addHook("preHandler", shopAuthHook);
  app.addHook("preHandler", checkRequestBodyHook);

  // Dev only hook
  if (import.meta.env.DEV) {
    app.addHook<{
      Body: Shop.CartRequestBody;
    }>("onResponse", async (_req, _res) => {
      const userData = _req.session.get("user");

      if (userData) {
        const { productId } = _req.body;
        const logger = (await import("@/utils/logger")).createLogger({
          tag: "CART",
        });
        logger.info(
          `Cart has (${userData?.cart[productId] ?? 0}) of ${productId} item.`,
        );
        logger.line();
      }
    });
  }

  app.post<CartRouteGeneric>(
    "/add",
    { preHandler: checkRequestBodyHook },
    async (_req, _res) => {
      const { productId, count } = _req.body;
      const userData = _req.session.get("user")!;

      const newCart = userData.cart;
      newCart[productId] = count ?? 1;

      _req.session.set("user", { ...userData, cart: newCart });

      return _res.status(201).send({
        status: "Cart Updated",
        message: `Cart has ${Object.keys(userData.cart).length} items 🛒`,
        data: userData,
      });
    },
  );

  app.post<CartRouteGeneric>(
    "/remove",
    { preHandler: checkRequestBodyHook },
    async (_req, _res) => {
      const { productId } = _req.body;
      const userData = _req.session.get("user")!;

      const { [productId]: removedItem, ...newCart } = userData.cart;

      _req.session.set("user", { ...userData, cart: newCart });

      return _res.status(201).send({
        status: "Cart Updated",
        message: `Cart has ${Object.keys(userData.cart).length} items 🛒`,
        data: userData,
      });
    },
  );

  app.post<CartRouteGeneric>("/clear", async (_req, _res) => {
    const userData = _req.session.get("user")!;

    _req.session.set("user", { ...userData, cart: {} });

    return _res.status(201).send({
      status: "Cart Cleared",
      message: `Cart has ${Object.keys(userData.cart).length} items 🛒`,
      data: userData,
    });
  });
};
