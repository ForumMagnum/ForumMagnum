
/// A rate-limiter with bursting. Allowable limit starts at burstLimit and
/// accumulates up to burstLimit at steadyStateLimit per second. Call
/// advanceTime when time has passed, canConsumeResource to check whether
/// something is allowable within the rate limit, and consumeResource to use
/// up the limit.
export class RateLimiter {
  burstLimit: number;
  steadyStateLimit: number;
  resource: number;
  lastUpdateTime: Date;
  
  constructor({burstLimit, steadyStateLimit, timestamp}: {
    burstLimit: number,
    steadyStateLimit: number,
    timestamp: Date,
  }) {
    this.burstLimit = burstLimit;
    this.steadyStateLimit = steadyStateLimit;
    this.resource = burstLimit;
    this.lastUpdateTime = timestamp;
  }
  
  advanceTime(timestamp: Date) {
    const timeElapsed = (timestamp.valueOf() - this.lastUpdateTime.valueOf())/1000;
    if (timeElapsed > 0) {
      const amountRegenerated = timeElapsed * this.steadyStateLimit;
      this.resource = Math.min(this.burstLimit, this.resource + amountRegenerated);
      this.lastUpdateTime = timestamp;
    }
  }
  
  canConsumeResource(cost: number) {
    return this.resource > cost;
  }
  
  consumeResource(cost: number) {
    this.resource -= cost;
  }
}
