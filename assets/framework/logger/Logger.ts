export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 99,
}

export class Logger {
  public static level = LogLevel.DEBUG;

  public static debug(tag: string, ...args: unknown[]): void {
    if (Logger.level <= LogLevel.DEBUG) console.debug(`[${tag}]`, ...args);
  }

  public static info(tag: string, ...args: unknown[]): void {
    if (Logger.level <= LogLevel.INFO) console.info(`[${tag}]`, ...args);
  }

  public static warn(tag: string, ...args: unknown[]): void {
    if (Logger.level <= LogLevel.WARN) console.warn(`[${tag}]`, ...args);
  }

  public static error(tag: string, ...args: unknown[]): void {
    if (Logger.level <= LogLevel.ERROR) console.error(`[${tag}]`, ...args);
  }
}
