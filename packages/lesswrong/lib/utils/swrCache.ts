
export class SwrCache<T> {
  private value: T|null
  private pendingValue: Promise<T>|null
  private generate: () => Promise<T>
  private lastUpdatedAt: number|null
  private expiryMs: number
  
  constructor(options: {
    generate: () => Promise<T>
    expiryMs: number
  }) {
    this.generate = options.generate;
    this.expiryMs = options.expiryMs;
  }

  async get(): Promise<T> {
    if (!this.lastUpdatedAt || !this.value) {
      await this.recompute();
      return this.value!;
    } else if (this.lastUpdatedAt < new Date().getTime() - this.expiryMs) {
      void this.recompute();
      return this.value;
    } else {
      return this.value;
    }
  }
  
  private async recompute() {
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
      this.pendingValue = this.generate();
      this.value = await this.pendingValue;
    }
    this.pendingValue = null;
    this.lastUpdatedAt = new Date().getTime();
  }
}
