import path from "path";
import { type Plugin } from "vite";

export const restartServerOnChange = (files: string[]): Plugin => {
  return {
    name: "restart-server-on-change",
    apply: "serve",

    configureServer(server) {
      const targets = files.map((file) => path.resolve(file));

      let timer: NodeJS.Timeout | undefined;
      let restarting = false;

      const isTargetFile = (file: string) => {
        return targets.some((target) => {
          return file === target || file.startsWith(target + path.sep);
        });
      };

      const onChange = (file: string) => {
        if (!isTargetFile(file)) return;

        clearTimeout(timer);

        timer = setTimeout(async () => {
          if (restarting) return;

          restarting = true;

          try {
            const relFile = path.relative(process.cwd(), file);

            server.config.logger.info(
              `\x1b[1m\x1b[32m(${relFile}) changed, restarting server...\x1b[0m`,
              {
                clear: true,
                timestamp: true,
              },
            );

            await server.restart();
          } catch (err) {
            const error = err as Error;

            server.config.logger.error(
              `\x1b[31m\x1bFailed to restart vite dev server:\x1b[0m \x1b[33m(${error.message})\x1b[0m`,
              {
                timestamp: true,
                clear: true,
                error,
              },
            );
          } finally {
            restarting = false;
          }
        }, 100);
      };

      server.watcher.add(targets);
      server.watcher.on("change", onChange);

      const cleanup = () => {
        clearTimeout(timer);
        server.watcher.off("change", onChange);
        restarting = false;
      };

      server.httpServer?.once("close", cleanup);
    },
  };
};
