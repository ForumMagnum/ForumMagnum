export interface Logger {
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export class ConsoleLogger implements Logger {
  private readonly prefix: string;
  private readonly enabled: boolean;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.enabled = process.env.NODE_ENV !== 'production';
  }

  info(...args: unknown[]) {
    if (!this.enabled) {
      return;
    }
    // eslint-disable-next-line no-console
    console.info(`[${this.prefix}]`, ...args);
  }

  warn(...args: unknown[]) {
    if (!this.enabled) {
      return;
    }
    // eslint-disable-next-line no-console
    console.warn(`[${this.prefix}]`, ...args);
  }

  error(...args: unknown[]) {
    if (!this.enabled) {
      return;
    }
    // eslint-disable-next-line no-console
    console.error(`[${this.prefix}]`, ...args);
  }
}
