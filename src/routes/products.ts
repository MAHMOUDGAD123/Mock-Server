import {
  getCachedValue,
  readJsonFile,
  saveToCache,
  waitFor,
} from "@/utils/tools";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { createCache } from "cache-manager";
import { CACHE, MODE } from "@/utils/configuration";
import type { Product } from "@/utils/data-generator";

const memCache = createCache({
  ttl: CACHE.TTL,
  refreshThreshold: CACHE.refreshThreshold(),
});

const readProducts = async (): Promise<Product[]> => {
  return await readJsonFile("public/db/products.json");
};

export const productsRoutes = async (app: FastifyInstance) => {
  app.get("/", async (req: FastifyRequest, res: FastifyReply) => {
    const query = req.query as {
      category?: string;
      search?: string;
      minPrice?: string;
      maxPrice?: string;
      page?: string;
      limit?: string;
    };

    const cacheKey = `products-${JSON.stringify(query)}`;
    const cachedValue = await getCachedValue(memCache, cacheKey, req);

    if (cachedValue) {
      return res.status(200).send(cachedValue);
    }

    if (MODE === "development") {
      await waitFor(1500);
    }

    let products = await readProducts();

    if (query.category) {
      products = products.filter(p => 
        p.category.toLowerCase().includes(query.category!.toLowerCase())
      );
    }

    if (query.search) {
      products = products.filter(p =>
        p.name.toLowerCase().includes(query.search!.toLowerCase()) ||
        p.description.toLowerCase().includes(query.search!.toLowerCase())
      );
    }

    if (query.minPrice) {
      const minPrice = parseFloat(query.minPrice);
      products = products.filter(p => p.price >= minPrice);
    }

    if (query.maxPrice) {
      const maxPrice = parseFloat(query.maxPrice);
      products = products.filter(p => p.price <= maxPrice);
    }

    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedProducts = products.slice(startIndex, endIndex);
    const total = products.length;
    const totalPages = Math.ceil(total / limit);

    const result = {
      data: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    res.send(result);
    saveToCache(memCache, cacheKey, result, req);
  });

  app.get("/:id", async (req: FastifyRequest, res: FastifyReply) => {
    const id = +(req.params as { id: string }).id;

    const validationResult = z.number().min(1).safeParse(id);

    if (!validationResult.success) {
      throw new Error(validationResult.error.issues[0]?.message);
    }

    const cacheKey = `products/${id}`;
    const cachedValue = await getCachedValue(memCache, cacheKey, req);

    if (cachedValue) {
      return res.status(200).send(cachedValue);
    }

    if (MODE === "development") {
      await waitFor(1000);
    }

    const product = (await readProducts()).find(p => p.id === id);

    if (!product) {
      return res.code(404).send({ error: "Product not found" });
    }

    res.send(product);
    saveToCache(memCache, cacheKey, product, req);
  });
};