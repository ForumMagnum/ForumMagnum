export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export class ConsoleLogger implements Logger {
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  info(...args: unknown[]) {
    console.info(`[${this.prefix}]`, ...args);
  }

  warn(...args: unknown[]) {
    console.warn(`[${this.prefix}]`, ...args);
  }

  error(...args: unknown[]) {
    console.error(`[${this.prefix}]`, ...args);
  }
}
