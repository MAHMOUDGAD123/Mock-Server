import type { FastifyInstance, FastifyRouteGenerics } from "fastify";
import { getCachedValue, memCache, saveToCache } from "@/utils/cache";
import { readProducts } from "@/utils/tools";

type ProductsRouteGenerics = FastifyRouteGenerics<
  Globals.ReplaySchema<Shop.ServerProductsStore>
>;
type ProductRouteGenerics = FastifyRouteGenerics<
  Globals.ReplaySchema<Shop.Product>,
  unknown,
  { id: string }
>;
type ProductsLookup = Record<string, Shop.Product>;

const buildAndCacheProducts = (productsStore: Shop.ServerProductsStore) => {
  // Build the products lookup & cache it
  const productsLookup: ProductsLookup = {};
  productsStore.list.forEach((prod) => {
    productsLookup[prod.id] = prod;
  });
  saveToCache(memCache, "products", productsStore);
  saveToCache(memCache, "products-lookup", productsLookup);
  return { ...productsLookup };
};

export const shopProductsRoutes = async (app: FastifyInstance) => {
  app.get<ProductsRouteGenerics>("/", async (_req, _res) => {
    let productsStore = await getCachedValue<Shop.ServerProductsStore>(
      memCache,
      "products",
    );

    // Build & cache products if not cached
    if (!productsStore) {
      if (import.meta.env.DEV) {
        const logger = (await import("@/utils/logger")).createLogger({
          tag: "Products",
        });
        logger.info("Build");
        logger.line();
      }

      productsStore = await readProducts();
      buildAndCacheProducts(productsStore);
    }

    return _res.status(200).send({
      status: "Done",
      message: "All products data.",
      data: productsStore,
    });
  });

  app.get<ProductRouteGenerics>("/:id", async (_req, _res) => {
    const { id } = _req.params;
    let productsLookup = await getCachedValue<ProductsLookup>(
      memCache,
      "products-lookup",
    );

    if (!productsLookup) {
      if (import.meta.env.DEV) {
        const logger = (await import("@/utils/logger")).createLogger({
          tag: "Product",
        });
        logger.info("Build");
        logger.line();
      }

      const productsStore = await readProducts();
      productsLookup = buildAndCacheProducts(productsStore);
    }

    const product = productsLookup[id];

    if (!product) {
      return _res.status(404).send({
        status: "Bad Request",
        message: `Sorry, Product with (${id}) doesn't exists.`,
      });
    }

    return _res.status(200).send({
      status: "Found",
      message: `Product with id of (${id}) found.`,
      data: product,
    });
  });
};
