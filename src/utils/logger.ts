interface LoggerOptions {
  tag?: "APP" | "SERVER" | "API" | (string & {});
}

export const createLogger = (options?: LoggerOptions) => {
  const { tag } = {
    tag: options?.tag ?? "API",
  } satisfies LoggerOptions;

  const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[90m",
    white: "\x1b[37m",
    black: "\x1b[30m",
    bgGray: "\x1b[100m",
    bgBlue: "\x1b[44m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgRed: "\x1b[41m",
    bgMagenta: "\x1b[45m",
  };

  const serverTag = (bg: string, text = c.white) => {
    return `${bg}${text}${c.bold} ${tag} ${c.reset}`;
  };

  const serverLoger = {
    clear: () => console.clear(),
    line: (n?: number) => console.log("\n".repeat(n ?? 0)),
    log: (...args: unknown[]) => console.log(serverTag(c.bgGray), ...args),
    info: (...args: unknown[]) => console.info(serverTag(c.bgBlue), ...args),
    success: (...args: unknown[]) => console.log(serverTag(c.bgGreen), ...args),
    warn: (...args: unknown[]) =>
      console.warn(serverTag(c.bgYellow, c.black), ...args),
    error: (...args: unknown[]) => console.error(serverTag(c.bgRed), ...args),
    debug: (...args: unknown[]) =>
      console.debug(serverTag(c.bgMagenta), ...args),
  };

  return serverLoger;
};
