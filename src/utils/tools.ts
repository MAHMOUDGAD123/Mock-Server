import { promises as fs } from "fs";
import path from "path";

/**
 * @param ms number of milliseconds
 */
export const waitFor = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const readLocalJsonFile = async (path: string) => {
  return JSON.parse(await fs.readFile(path, "utf-8"));
};

export const readUsers = () => {
  return readLocalJsonFile(
    path.join(process.cwd(), "public/db/users.json"),
  ) as Promise<Database.UserInfoType[]>;
};

export const readPosts = () => {
  return readLocalJsonFile(
    path.join(process.cwd(), "public/db/posts.json"),
  ) as Promise<Database.PostInfoType[]>;
};

export const readProducts = () => {
  return readLocalJsonFile(
    path.join(process.cwd(), "public/db/products.json"),
  ) as Promise<Shop.ServerProductsStore>;
};
