export interface RequestData {
  ip: string;
  userAgent: string;
  userId?: string;
}

interface RequestWithPriority<T extends RequestData> {
  request: T;
  preOpPriority: number;
}

interface NoRequest {
  request?: undefined;
  preDequeuePriority?: undefined;
}

type DequeueWithPriorityResult<T extends RequestData> = RequestWithPriority<T> | NoRequest;

/**
 * This is a special-cased "priority" queue meant to handle SSR requests when we have too many being rendered.
 * Its performance is very different from a regular priority queue:
 * 
 * - Median enqueue and dequeue are O(1), not O(log n).
 * 
 * - Any enqueue or dequeue which causes the request to have a different priority after the operation than before rebuckets all the requests, which is O(n).
 * 
 * This doesn't happen with any guaranteed frequency; it only happens when some IP and/or user agent crosses a threshold percentage of all requests in the queue.
 * 
 * So in theory the worst-case amortized performance is O(n).
 * But in practice it's extremely unlikely for some IP or user agent to bounce above and below the threshold by accident (at larger queue sizes),
 * since by construction we prioritize dequeueing requests which are least likely to change any thresholds, and if someone wants to DoS us there are much easier ways.
 */
export default class PriorityBucketQueue<T extends RequestData> {
  private buckets: [T[], T[], T[], T[], T[]];
  private userAgentsInQueue: Record<string, number>;
  private ipsInQueue: Record<string, number>;

  constructor() {
    this.buckets = [[], [], [], [], []];
    this.userAgentsInQueue = {};
    this.ipsInQueue = {};
  }

  enqueue(request: T): void {
    const priority = this.getItemPriority(request);
    if (!this.buckets[priority]) {
      this.buckets[priority] = [];
    }
    this.buckets[priority].push(request);
    this.increaseCounts(request);
    this.rebucketRequests({ request, preOpPriority: priority });
  }

  dequeue(): T | undefined {
    const requestWithPriority = this.dequeueWithPriority();

    if (this.dequeueResultHasRequest(requestWithPriority)) {
      this.decreaseCounts(requestWithPriority.request);
      this.rebucketRequests(requestWithPriority);
    }

    return requestWithPriority.request;
  }

  private dequeueWithPriority(): DequeueWithPriorityResult<T> {
    let bucketIdx = 0;
    while (bucketIdx < this.buckets.length) {
      // We need to get the priority of the request before removing it from the bucket, since `getItemPriority` depends on the sum of all the bucket lengths
      const request = this.buckets[bucketIdx][0];
      if (request) {
        const preDequeuePriority = this.getItemPriority(request);
        this.buckets[bucketIdx].shift();
        return { request, preOpPriority: preDequeuePriority };
      } else {
        bucketIdx++;
      }
    }

    return {};
  }

  private dequeueResultHasRequest(result: DequeueWithPriorityResult<T>): result is RequestWithPriority<T> {
    return !!result.request;
  }

  private resetBuckets() {
    this.buckets = [[], [], [], [], []];
  }

  /**
   * If a request's priority has changed after being enqueued/dequeued, that means there are other requests coming from the same IP and/or user agent that also need to have their priority changed.
   * We need to check all the buckets because requests with the same IP and/or user agent can still have different priorities:
   * - there may be many requests from e.g. the same user agent, but some of them are logged out and some are logged in
   * - there may be many requests from e.g. the same IP, with enough having the same user agent to have +3 priority, and some having other user agents (and thus only +2 priority)
   */
  private rebucketRequests(requestWithPriority: RequestWithPriority<T>) {
    const { request, preOpPriority } = requestWithPriority;
    const postOpPriority = this.getItemPriority(request);
    if (preOpPriority !== postOpPriority) {
      const allRequestsWithNewPriorities = this.buckets.flatMap(requests => requests.map(request => [this.getItemPriority(request), request] as const));
      this.resetBuckets();
      allRequestsWithNewPriorities.forEach(([newPriority, request]) => this.buckets[newPriority].push(request));
    }
  }

  private increaseCounts(request: T) {
    const { userAgent, ip } = request;
    const queuedUserAgentCount = this.userAgentsInQueue[userAgent];
    if (queuedUserAgentCount) {
      this.userAgentsInQueue[userAgent]++;
    } else {
      this.userAgentsInQueue[userAgent] = 1;
    }

    const queuedIpCount = this.ipsInQueue[ip];
    if (queuedIpCount) {
      this.ipsInQueue[ip]++;
    } else {
      this.ipsInQueue[ip] = 1;
    }
  }

  private decreaseCounts(request: T) {
    const { userAgent, ip } = request;
    const queuedUserAgentCount = this.userAgentsInQueue[userAgent];
    if (queuedUserAgentCount === 1) {
      delete this.userAgentsInQueue[userAgent];
    } else if (queuedUserAgentCount) {
      this.userAgentsInQueue[userAgent]--;
    }

    const queuedIpCount = this.ipsInQueue[ip];
    if (queuedIpCount === 1) {
      delete this.ipsInQueue[ip];
    } else if (queuedIpCount) {
      this.ipsInQueue[ip]--;
    }
  }

  size() {
    return this.buckets.reduce((prev, curr) => {
      return prev + curr.length;
    }, 0);
  }

  private getItemPriority(request: T): number {
    const { userAgent, ip, userId } = request;
    let priority = 0;
    const queuedUserAgentCount = this.userAgentsInQueue[userAgent];
    const queuedIpCount = this.ipsInQueue[ip];
    const queueSize = this.size();

    if (!userId) {
      priority += 1;
    }

    if (queueSize >= 3) {
      const queueIpFraction = queuedIpCount / queueSize;
      const queueUserAgentFraction = queuedUserAgentCount / queueSize;

      if (queueIpFraction > 0.3) {
        priority += 2;
      }

      if (queueUserAgentFraction > 0.3) {
        priority += 1;
      }
    }

    return priority;
  }
}

