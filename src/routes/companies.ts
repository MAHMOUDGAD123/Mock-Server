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
import type { Company } from "@/utils/data-generator";

const memCache = createCache({
  ttl: CACHE.TTL,
  refreshThreshold: CACHE.refreshThreshold(),
});

const readCompanies = async (): Promise<Company[]> => {
  return await readJsonFile("public/db/companies.json");
};

export const companiesRoutes = async (app: FastifyInstance) => {
  app.get("/", async (req: FastifyRequest, res: FastifyReply) => {
    const query = req.query as {
      industry?: string;
      search?: string;
      minEmployees?: string;
      maxEmployees?: string;
      page?: string;
      limit?: string;
    };

    const cacheKey = `companies-${JSON.stringify(query)}`;
    const cachedValue = await getCachedValue(memCache, cacheKey, req);

    if (cachedValue) {
      return res.status(200).send(cachedValue);
    }

    if (MODE === "development") {
      await waitFor(1500);
    }

    let companies = await readCompanies();

    if (query.industry) {
      companies = companies.filter(c => 
        c.industry.toLowerCase().includes(query.industry!.toLowerCase())
      );
    }

    if (query.search) {
      companies = companies.filter(c =>
        c.name.toLowerCase().includes(query.search!.toLowerCase()) ||
        c.description.toLowerCase().includes(query.search!.toLowerCase())
      );
    }

    if (query.minEmployees) {
      const minEmployees = parseInt(query.minEmployees);
      companies = companies.filter(c => c.employees >= minEmployees);
    }

    if (query.maxEmployees) {
      const maxEmployees = parseInt(query.maxEmployees);
      companies = companies.filter(c => c.employees <= maxEmployees);
    }

    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "20");
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedCompanies = companies.slice(startIndex, endIndex);
    const total = companies.length;
    const totalPages = Math.ceil(total / limit);

    const result = {
      data: paginatedCompanies,
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

    const cacheKey = `companies/${id}`;
    const cachedValue = await getCachedValue(memCache, cacheKey, req);

    if (cachedValue) {
      return res.status(200).send(cachedValue);
    }

    if (MODE === "development") {
      await waitFor(1000);
    }

    const company = (await readCompanies()).find(c => c.id === id);

    if (!company) {
      return res.code(404).send({ error: "Company not found" });
    }

    res.send(company);
    saveToCache(memCache, cacheKey, company, req);
  });
};