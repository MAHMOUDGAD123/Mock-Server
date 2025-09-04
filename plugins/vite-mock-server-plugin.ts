import mockServer from "./mock-server-plugin/index";

export const viteMockServerPlugin = () =>
  mockServer({
    logLevel: "info",
    urlPrefixes: ["*/api/"],
    mockRootDir: "./src",
    mockJsSuffix: "*.js",
    mockTsSuffix: "*.ts",
    noHandlerResponse404: true,
    mockModules: [],
    middlewares: [],
    printStartupLog: false,
  });
