type CacheKeys =
  | "products"
  | "products-lookup"
  | "products/[id]"
  | "posts"
  | "posts/[id]"
  | "users"
  | "users/[id]"
  | "users/[id]/posts"
  | "users/[userId]/posts/[postId]"
  | "yt/[videoID]"
  | "yt/[listUrl]"
  | (string & {});
