import type { FastifyInstance } from "fastify";
import { shopAuthRoutes } from "@/routes/shop/auth";
import { shopCartRoutes } from "@/routes/shop/cart";
import { shopPreferencesRoutes } from "@/routes/shop/preferences";
import { shopProductsRoutes } from "@/routes/shop/products";

export const shopRoutes = async (app: FastifyInstance) => {
  app.register(shopAuthRoutes, { prefix: "/auth" });
  app.register(shopCartRoutes, { prefix: "/cart" });
  app.register(shopPreferencesRoutes, { prefix: "/preferences" });
  app.register(shopProductsRoutes, { prefix: "/products" });
};
