
/// A rate-limiter with bursting. Allowable limit starts at burstLimit and
/// accumulates up to burstLimit at steadyStateLimit per second. Call
/// advanceTime when time has passed, canConsumeResource to check whether
/// something is allowable within the rate limit, and consumeResource to use
/// up the limit.
export class RateLimiter {
  constructor({burstLimit, steadyStateLimit, timestamp}) {
    this.burstLimit = burstLimit;
    this.steadyStateLimit = steadyStateLimit;
    this.resource = burstLimit;
    this.lastUpdateTime = timestamp;
  }
  
  advanceTime(timestamp) {
    const timeElapsed = (timestamp - this.lastUpdateTime)/1000;
    if (timeElapsed > 0) {
      const amountRegenerated = timeElapsed * this.steadyStateLimit;
      this.resource = Math.min(this.burstLimit, this.resource + amountRegenerated);
      this.lastUpdateTime = timestamp;
    }
  }
  
  canConsumeResource(cost) {
    return this.resource > cost;
  }
  
  consumeResource(cost) {
    this.resource -= cost;
  }
}
