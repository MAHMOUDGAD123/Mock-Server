import {
  type Plugin,
  type ViteDevServer,
  type Connect,
  createLogger,
  type LogOptions,
} from "vite";
import * as http from "http";
import AntPathMatcher from "@howiefh/ant-path-matcher";
import chokidar, { type FSWatcher } from "chokidar";
import path from "path";
import fs from "fs";
import { build } from "esbuild";

const PLUGIN_NAME = "vite-plugin-mock-server";
const TEMPORARY_FILE_SUFFIX = ".tmp.cjs";
let LOG_LEVEL = "error";
const requireCache = new Map<string, any>();
const logger = createLogger("info", {
  allowClearScreen: true,
});
const loggerOptions: LogOptions = { clear: true, timestamp: true };

type Request = Connect.IncomingMessage & {
  body?: any;
  params?: { [key: string]: string };
  query?: { [key: string]: string };
  cookies?: { [key: string]: string };
  session?: any;
};

export type MockFunction = {
  (
    req: Request,
    res: http.ServerResponse,
    /** @deprecated in 2.0, use req.params **/
    urlVars?: { [key: string]: string },
  ): void;
};

export type MockLayer = (
  req: Request,
  res: http.ServerResponse,
  next: Connect.NextFunction,
) => void;

export type MockHandler = {
  pattern: string;
  method?: string;
  handle: MockFunction;
};

export type MockOptions = {
  logLevel?: "info" | "error" | "off";
  urlPrefixes?: string[];
  mockJsSuffix?: string;
  mockTsSuffix?: string;
  mockRootDir?: string;
  mockModules?: string[];
  noHandlerResponse404?: boolean;
  middlewares?: MockLayer[];
  printStartupLog?: boolean;
};

let activeMockWatcher: FSWatcher | undefined;

export default (options?: MockOptions): Plugin => {
  return {
    name: PLUGIN_NAME,

    configureServer: async (server: ViteDevServer) => {
      const matcher = new AntPathMatcher();

      options = options || {};
      options.logLevel = options.logLevel || "error";
      options.urlPrefixes = options.urlPrefixes || ["/api/"];
      options.mockRootDir = options.mockRootDir || "./mock";
      options.mockJsSuffix = options.mockJsSuffix || ".mock.js";
      options.mockTsSuffix = options.mockTsSuffix || ".mock.ts";

      options.noHandlerResponse404 =
        typeof options.noHandlerResponse404 !== "boolean"
          ? true
          : options.noHandlerResponse404;

      options.printStartupLog =
        typeof options.printStartupLog !== "boolean"
          ? true
          : options.printStartupLog;

      if (options.mockModules && options.mockModules.length > 0) {
        logger.warn(
          [
            "[",
            PLUGIN_NAME,
            "] mock modules will be set automatically, and the configuration will be ignored [",
            options.mockModules.join(" - "),
            "]",
          ].join(" "),
          loggerOptions,
        );
      }

      options.mockModules = [];
      LOG_LEVEL = options.logLevel;

      // IMPORTANT:
      // Close previous watcher if one is still alive.
      await activeMockWatcher?.close().catch(() => {});
      activeMockWatcher = undefined;

      // Create a new watcher.
      const mockWatcher = await watchMockFiles(options);
      activeMockWatcher = mockWatcher;

      if (options?.printStartupLog) {
        logger.info(
          "[" + PLUGIN_NAME + "] mock server started. options = ",
          loggerOptions,
        );
        console.log(options);
      }

      // IMPORTANT:
      // Cleanup when Vite dev server closes/restarts.
      let disposed = false;

      const disposeMockWatcher = () => {
        if (disposed) return;
        disposed = true;

        if (activeMockWatcher === mockWatcher) {
          activeMockWatcher = undefined;
        }

        mockWatcher.close().catch(() => {});
      };

      server.httpServer?.once("close", disposeMockWatcher);

      // Extra safety for restart implementations that may not emit close quickly.
      const anyServer = server as any;
      const originalClose = anyServer.close?.bind(server);

      if (originalClose) {
        anyServer.close = async () => {
          disposeMockWatcher();
          return originalClose();
        };
      }

      if (options.middlewares) {
        for (const [, layer] of options.middlewares.entries()) {
          server.middlewares.use((req, res, next) => {
            const hasMatch = options?.urlPrefixes?.some((prefix) =>
              req.url?.startsWith(prefix),
            );

            if (hasMatch) {
              layer(req, res, next);
            } else {
              next();
            }
          });
        }
      }

      server.middlewares.use(
        (
          req: Connect.IncomingMessage,
          res: http.ServerResponse,
          next: Connect.NextFunction,
        ) => {
          doHandle(options!, matcher, req, res, next);
        },
      );
    },
  };
};

async function importCache(modName: string) {
  const mod = await import("file://" + modName);
  let module;
  if (mod.default && mod.default.default) module = mod.default;
  else module = mod;

  requireCache.set(modName, module);
  return module;
}

const doHandle = async (
  options: MockOptions,
  matcher: AntPathMatcher,
  req: Request,
  res: http.ServerResponse,
  next: Connect.NextFunction,
) => {
  for (const [, prefix] of options?.urlPrefixes!?.entries()) {
    if (!req?.url?.startsWith(prefix)) continue;
    for (const [, modName] of options?.mockModules!?.entries()) {
      const module = requireCache.get(modName);

      if (!module) {
        continue;
      }
      let handlers: MockHandler[];
      if (modName.endsWith(TEMPORARY_FILE_SUFFIX)) {
        const exports = module.default;
        logInfo("typeof exports", typeof exports);
        if (typeof exports === "function") {
          handlers = exports();
        } else {
          handlers = exports;
        }
      } else {
        handlers = module.default;
      }

      for (const [, handler] of handlers.entries()) {
        const [path, qs] = req.url.split("?");
        const pathVars: { [key: string]: string } = {};
        let matched = matcher.doMatch(handler.pattern, path!, true, pathVars);
        if (matched && handler.method) {
          matched = handler.method === req.method;
        }

        if (matched) {
          logInfo(
            "matched and call mock handler",
            handler,
            "pathVars",
            pathVars,
          );
          req.params = pathVars;
          req.query = parseQueryString(qs!);
          handler.handle(req, res, { ...pathVars });
          return;
        }
      }
    }
    if (options.noHandlerResponse404) {
      res.statusCode = 404;
      const { url, method } = req;
      res.end(
        "[" +
          PLUGIN_NAME +
          '] no handler found, { url: "' +
          url +
          '", method: "' +
          method +
          '" }',
      );
      return;
    }
  }
  next();
};

const watchMockFiles = async (options: MockOptions): Promise<FSWatcher> => {
  const watchDir = path.resolve(process.cwd(), options?.mockRootDir!);

  await loadMockModules(options, watchDir);

  const watcher = chokidar.watch(watchDir, {
    ignoreInitial: true,
  });

  watcher.on("all", async (event, filePath) => {
    if (filePath.endsWith(TEMPORARY_FILE_SUFFIX)) return;

    logInfo("event", event, "path", filePath);

    if (event === "addDir") return;

    if (event === "unlinkDir") {
      for (const modName of [...requireCache.keys()]) {
        if (modName.startsWith(watchDir)) {
          await deleteMockModule(options, modName);
        }
      }

      await loadMockModules(options, watchDir);
      return;
    }

    if (
      !filePath.endsWith(options?.mockJsSuffix!) &&
      !filePath.endsWith(options?.mockTsSuffix!)
    ) {
      return;
    }

    if (event === "add" || event === "change") {
      await loadMockModule(options, filePath);
    } else if (event === "unlink") {
      await deleteMockModule(options, filePath);
    }
  });

  return watcher;
};

const loadMockModules = async (options: MockOptions, watchDir: string) => {
  // logInfo("recursive loading mock modules", watchDir);
  for (const [, name] of fs.readdirSync(watchDir).entries()) {
    const modName = path.join(watchDir, name);
    const stat = fs.statSync(modName);
    if (stat.isDirectory()) {
      loadMockModules(options, modName);
      continue;
    }
    if (!stat.isFile()) return;
    await loadMockModule(options, modName);
  }
};

const loadMockModule = async (options: MockOptions, moduleName: string) => {
  // logInfo("loading mock module", moduleName);
  if (moduleName.endsWith(options?.mockJsSuffix!)) {
    await loadJsMockModule(options, moduleName);
  } else if (moduleName.endsWith(options?.mockTsSuffix!)) {
    await loadTsMockModule(options, moduleName);
  }
};

const loadJsMockModule = async (
  options: MockOptions,
  moduleName: string,
  skipCheck?: boolean,
) => {
  if (!skipCheck) {
    if (!moduleName.endsWith(options?.mockJsSuffix!)) return;
    if (!fs.statSync(moduleName).isFile()) return;
  }
  await deleteMockModule(options, moduleName);
  // logInfo("loading js mock module", moduleName);
  const handlers = await importCache(moduleName);
  if (!moduleName.endsWith(TEMPORARY_FILE_SUFFIX)) {
    logInfo("loaded mock handlers", handlers);
  }
  if (typeof handlers.default === "function") {
    logInfo("loaded mock handlers", handlers.default());
  } else {
    logInfo("loaded mock handlers", handlers.default);
  }
  options?.mockModules!.push(moduleName);
};

const loadTsMockModule = async (options: MockOptions, moduleName: string) => {
  if (!moduleName.endsWith(options?.mockTsSuffix!)) return;
  if (!fs.statSync(moduleName).isFile()) return;
  logInfo("loading ts mock module", moduleName);
  const result = await build({
    entryPoints: [moduleName],
    outfile: "out.js",
    write: false,
    platform: "node",
    bundle: true,
    format: "cjs",
    metafile: true,
    target: "es2015",
  });
  const text = result.outputFiles[0]?.text!;
  const modName = moduleName + TEMPORARY_FILE_SUFFIX;
  fs.writeFileSync(modName, text);
  await loadJsMockModule(options, modName, true);
  fs.unlink(modName, (err) => {
    if (err) logErr("delete file " + modName + " error", err);
  });
};

const deleteMockModule = async (options: MockOptions, moduleName: string) => {
  logInfo("delete module cache", moduleName);
  requireCache.delete(moduleName);
  for (const [i, modName] of options?.mockModules!.entries()) {
    if (modName === moduleName) {
      options?.mockModules!.splice(i, 1);
    }
  }
};

let lastModuleName: string | undefined;
let counter: number = 1;
const logInfo = (...optionalParams: any[]) => {
  if (LOG_LEVEL !== "info") return;

  let newModuleName = optionalParams[3];

  if (newModuleName) {
    newModuleName = newModuleName
      .slice(newModuleName.indexOf("\\src"))
      .replaceAll("\\", "/");

    if (newModuleName === lastModuleName) {
      ++counter;
    } else {
      counter = 1;
      lastModuleName = newModuleName;
    }
  } else {
    counter = 1;
    lastModuleName = "";
  }

  newModuleName = newModuleName ?? optionalParams.join(" - ");
  logger.info(
    [
      "\x1b[30m\x1b[2m(server)\x1b[0m",
      "\x1b[1m\x1b[32mreload\x1b[0m",
      "[",
      `\x1b[90m${newModuleName}\x1b[0m`,
      "]",
    ].join(" "),
    loggerOptions,
  );
};

const parseQueryString = (qs: string): { [key: string]: string } =>
  !qs
    ? {}
    : decodeURI(qs)
        .split("&")
        .map((param) => param.split("="))
        .reduce((values: { [key: string]: string }, [key, value]) => {
          values[key!] = value!;
          return values;
        }, {});

const logErr = (...optionalParams: any[]) => {
  if (LOG_LEVEL === "off") return;

  logger.error(
    [
      "\x1b[30m\x1b[2m(server)\x1b[0m",
      "\x1b[33m\x1b[1merror\x1b[0m",
      "[\x1b[90m",
      optionalParams.join(" - "),
      "\x1b[0m]",
    ].join(" "),
    loggerOptions,
  );
};
