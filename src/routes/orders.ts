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
import type { Order } from "@/utils/data-generator";

const memCache = createCache({
  ttl: CACHE.TTL,
  refreshThreshold: CACHE.refreshThreshold(),
});

const readOrders = async (): Promise<Order[]> => {
  return await readJsonFile("public/db/orders.json");
};

export const ordersRoutes = async (app: FastifyInstance) => {
  app.get("/", async (req: FastifyRequest, res: FastifyReply) => {
    const query = req.query as {
      userId?: string;
      status?: string;
      minTotal?: string;
      maxTotal?: string;
      page?: string;
      limit?: string;
    };

    const cacheKey = `orders-${JSON.stringify(query)}`;
    const cachedValue = await getCachedValue(memCache, cacheKey, req);

    if (cachedValue) {
      return res.status(200).send(cachedValue);
    }

    if (MODE === "development") {
      await waitFor(1500);
    }

    let orders = await readOrders();

    if (query.userId) {
      const userId = parseInt(query.userId);
      orders = orders.filter(o => o.userId === userId);
    }

    if (query.status) {
      orders = orders.filter(o => o.status === query.status);
    }

    if (query.minTotal) {
      const minTotal = parseFloat(query.minTotal);
      orders = orders.filter(o => o.total >= minTotal);
    }

    if (query.maxTotal) {
      const maxTotal = parseFloat(query.maxTotal);
      orders = orders.filter(o => o.total <= maxTotal);
    }

    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedOrders = orders.slice(startIndex, endIndex);
    const total = orders.length;
    const totalPages = Math.ceil(total / limit);

    const result = {
      data: paginatedOrders,
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

    const cacheKey = `orders/${id}`;
    const cachedValue = await getCachedValue(memCache, cacheKey, req);

    if (cachedValue) {
      return res.status(200).send(cachedValue);
    }

    if (MODE === "development") {
      await waitFor(1000);
    }

    const order = (await readOrders()).find(o => o.id === id);

    if (!order) {
      return res.code(404).send({ error: "Order not found" });
    }

    res.send(order);
    saveToCache(memCache, cacheKey, order, req);
  });
};