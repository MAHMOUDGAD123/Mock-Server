// node
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    SESSION_SECRET: string;
    PORT?: string;
    VERCEL?: "1"; // will be "1" when running on Vercel
    VERCEL_ENV?: "development" | "preview" | "production";
    VERCEL_URL?: string;
  }
}

// vite
interface ImportMetaEnv {
  // readonly VITE_VERCEL: string; // will be "1" when running on Vercel
  // readonly VITE_VERCEL_ENV: "production" | "preview" | "development";
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
