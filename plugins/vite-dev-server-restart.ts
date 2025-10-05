import path from "path";
import { type Plugin } from "vite";

export const restartServerOnChange = (files: string[]): Plugin => {
  return {
    name: "restart-server-on-change",

    configureServer(server) {
      const { watcher, config } = server;

      watcher.add(files);

      watcher.on("change", async (file) => {
        if (files.some((f) => file.includes(f))) {
          try {
            const relFile = path.relative(process.cwd(), file);
            config.logger.info(
              `\x1b[1m\x1b[32m(${relFile}) changed, restarting server...\x1b[0m`,
              {
                clear: true,
                timestamp: true,
              }
            );
            await server.restart();
          } catch (err) {
            const error = err as Error;
            config.logger.error(
              `\x1b[31m\x1bFailed to restart vite dev server:\x1b[0m \x1b[33m(${error.message})\x1b[0m`,
              {
                timestamp: true,
                clear: true,
                error,
              }
            );
          }
        }
      });
    },
  };
};
