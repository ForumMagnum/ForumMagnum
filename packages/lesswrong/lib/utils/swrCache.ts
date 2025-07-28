import { backgroundTask } from "@/server/utils/backgroundTask"

export class SwrCache<T, Args extends any[]> {
  private value: T|null
  private pendingValue: Promise<T>|null
  private generate: (...args: Args) => Promise<T>
  private lastUpdatedAt: number|null
  private expiryMs: number
  
  constructor(options: {
    generate: (...args: Args) => Promise<T>
    expiryMs: number
  }) {
    this.generate = options.generate;
    this.expiryMs = options.expiryMs;
  }

  async get(...args: Args): Promise<T> {
    if (!this.lastUpdatedAt || !this.value) {
      await this.recompute(...args);
      return this.value!;
    } else if (this.lastUpdatedAt < new Date().getTime() - this.expiryMs) {
      backgroundTask(this.recompute(...args));
      return this.value;
    } else {
      return this.value;
    }
  }
  
  private async recompute(...args: Args) {
    // If this is replacing an existing cache entry, update the last-updated
    // date first, so that subsequent requests don't also attempt to perform
    // the same update.
    if (this.lastUpdatedAt) {
      this.lastUpdatedAt = new Date().getTime();
    }

    if (this.pendingValue) {
      await this.pendingValue;
      return this.value!;
    } else {
      this.pendingValue = this.generate(...args);
      this.value = await this.pendingValue;
    }
    this.pendingValue = null;
    this.lastUpdatedAt = new Date().getTime();
  }
}
