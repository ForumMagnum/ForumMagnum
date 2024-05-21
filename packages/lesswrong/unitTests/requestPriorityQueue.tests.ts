import type { PartialDeep } from 'type-fest'
import PriorityBucketQueue, { RequestData, RequestWithPriority } from '../lib/requestPriorityQueue';

let userAgentCounter = 0;
let ipCounter = 0;

function resetUserAgentCounter() {
  userAgentCounter = 0;
}

function generateMockUserAgent() {
  return `UserAgent${++userAgentCounter}`;
}

function mockRequest(props: { ip?: string, userAgent?: string, userId?: string }) {
  const {
    ip = generateMockIpAddress(),
    userAgent = generateMockUserAgent(),
    userId
  } = props;
  return { ip, userAgent, userId };
}

function resetIpCounter() {
  ipCounter = 0;
}

function generateMockIpAddress(): string {
  if (ipCounter >= 255) {
    throw new Error('Too many IP addresses generated in test case!');
  }
  return `127.0.0.${++ipCounter}`;
}

describe('PriorityBucketQueue', () => {
  const userId1 = 'user-123';
 
  let queue: PriorityBucketQueue<RequestData>;
 
  beforeEach(() => {
    queue = new PriorityBucketQueue();
  });

  beforeEach(() => {
    resetUserAgentCounter();
    resetIpCounter();
  });

  it('should return undefined when dequeueing from an empty queue', () => {
    expect(queue.dequeue().request).toBeUndefined();
  });

  it('should deprioritize a burst of traffic from a single IP', () => {
    const requestsFromIP1 = [];
    const threshold = 4; // We create enough requests to pass the queue size threshold
    const ip1 = generateMockIpAddress();
    const ip2 = generateMockIpAddress();
  
    for (let i = 0; i < threshold; i++) {
      const request = mockRequest({ ip: ip1 });
      queue.enqueue(request);
      requestsFromIP1.push(request);

      // Every request before the last one should be priority 1; the last one should cause a +2 priority rebucketing
      const expectedPriority = i < 3 ? 1 : 3;
      const currentNextResult = queue.peek();
      expect(currentNextResult).toEqual(expect.objectContaining<RequestWithPriority<RequestData>>({ request: requestsFromIP1[0], preOpPriority: expectedPriority }));
    }
  
    const requestFromIP2 = mockRequest({ ip: ip2 });
    queue.enqueue(requestFromIP2);
  
    // Check that the requestFromIP2 gets dequeued first due to lower priority of ip1 requests being above the threshold
    expect(queue.dequeue().request).toEqual(requestFromIP2);
  
    // Now check that the rest of the dequeued items are from ip1
    requestsFromIP1.forEach((request, idx) => {
      const dequeueResult = queue.dequeue();

      // The first item dequeued should have had priority 3, but everything gets rebucketed after that since there aren't enough requests in the queue anymore
      const expectedPriority = idx > 0 ? 1 : 3;
      expect(dequeueResult).toEqual(expect.objectContaining<RequestWithPriority<RequestData>>({ request, preOpPriority: expectedPriority }));
    });
    
    expect(queue.size()).toBe(0);  
  });

  it('should deprioritize a burst of traffic from a single user agent', () => {
    const requestsFromUserAgent1: RequestData[] = [];
    const requestsFromUserAgent2: RequestData[] = [];

    const userAgent1 = generateMockUserAgent();
    const userAgent2 = generateMockUserAgent();
  
    // Push two requests from userAgent1, then two requests from userAgent2
    // This will fill up the queue to the required threshold size where we start checking user-agent %, without actually causing any user-agent to be >60% of the queue
    const firstRequest = mockRequest({ userAgent: userAgent1 });
    const secondRequest = mockRequest({ userAgent: userAgent1 });
    const thirdRequest = mockRequest({ userAgent: userAgent2 });
    const fourthRequest = mockRequest({ userAgent: userAgent2 });

    requestsFromUserAgent1.push(firstRequest, secondRequest);
    requestsFromUserAgent2.push(thirdRequest, fourthRequest);

    [firstRequest, secondRequest, thirdRequest, fourthRequest].forEach(request => {
      queue.enqueue(request);
      // The request that'd be returned if dequeued after all four of these should be the first one in
      expect(queue.peek()).toEqual(
        expect.objectContaining<RequestWithPriority<RequestData>>({ request: firstRequest, preOpPriority: 1 })
      );
    });

    // Queue a third request with userAgent1.  That's 60%, which is at but not over the threshold.
    const fifthRequest = mockRequest({ userAgent: userAgent1 });
    queue.enqueue(fifthRequest);
    requestsFromUserAgent1.push(fifthRequest);
    expect(queue.peek()).toEqual(expect.objectContaining<RequestWithPriority<RequestData>>({ request: firstRequest, preOpPriority: 1 }));

    // Push a fourth request with userAgent1.  That's over 60%, which should cause rebucketing.
    // On dequeueing, we'd expect to see the first request with userAgent2.
    const sixthRequest = mockRequest({ userAgent: userAgent1 });
    queue.enqueue(sixthRequest);
    requestsFromUserAgent1.push(sixthRequest);
    expect(queue.peek()).toEqual(expect.objectContaining<RequestWithPriority<RequestData>>({ request: thirdRequest, preOpPriority: 1 }));
  
    // We expect to dequeue all the userAgent2 requests first
    requestsFromUserAgent2.forEach((request) => {
      expect(queue.dequeue()).toEqual(
        expect.objectContaining<RequestWithPriority<RequestData>>({ request, preOpPriority: 1 })
      );      
    });
    
    // The rest of the dequeued items should come from userAgent1
    requestsFromUserAgent1.forEach((request, idx) => {
      const dequeueResult = queue.dequeue();

      // The first item dequeued should have had priority 2, but everything gets rebucketed after that since there aren't enough requests in the queue anymore
      const expectedPriority = idx > 0 ? 1 : 2;
      expect(dequeueResult).toEqual(
        expect.objectContaining<RequestWithPriority<RequestData>>({ request, preOpPriority: expectedPriority })
      );      
    });
  
    expect(queue.size()).toBe(0);  
  });

  it('should penalize crossing the IP threshold as much as crossing the user-agent plus being logged out', () => {
    const justUnderThreshold = 3;  // Getting the count just under the threshold
    
    const userAgent1 = generateMockUserAgent();
    const userAgent2 = generateMockUserAgent();
    const ip1 = generateMockIpAddress();
    const ip2 = generateMockIpAddress();

    const requestsFromSameIPAndUA = [];

    for (let i = 0; i < justUnderThreshold; i++) {
      const request = mockRequest({ ip: ip1, userAgent: userAgent1 });
      queue.enqueue(request);
      requestsFromSameIPAndUA.push(request);
    }
  
    queue.enqueue(mockRequest({ ip: ip1, userAgent: userAgent2, userId: userId1 })); // Different UA and logged-in user
    queue.enqueue(mockRequest({ ip: ip2, userAgent: userAgent1 })); // Different IP
  
    // Expect logged-in user request to be prioritized with crossed IP threshold to come out first, since it went in first, but with priority 2
    expect(queue.dequeue()).toMatchObject<PartialDeep<RequestWithPriority<RequestData>>>({ request: { userId: userId1 }, preOpPriority: 2 });
    // Expect the next request to come out with the same priority, due to the crossed user-agent threshold
    expect(queue.dequeue()).toMatchObject<PartialDeep<RequestWithPriority<RequestData>>>({ request: { ip: ip2 }, preOpPriority: 2 });

    // Expect the remaining requests in the queue to be the first three that went in
    requestsFromSameIPAndUA.forEach((request) => {
      expect(queue.dequeue().request).toEqual(request);
    });

    expect(queue.size()).toEqual(0);
  });

  it('should handle multiple priority levels while over the queue size threshold', () => {
    const userAgent1 = generateMockUserAgent();
    const userAgent2 = generateMockUserAgent();

    const ip1 = generateMockIpAddress();
    const ip2 = generateMockIpAddress();

    const request1 = mockRequest({ ip: ip1, userAgent: userAgent2 });
    const request2 = mockRequest({ ip: ip1, userAgent: userAgent2 });
    const request3 = mockRequest({ ip: ip1, userAgent: userAgent2 });
    const request4 = mockRequest({ ip: ip1, userAgent: userAgent1 });
    const request5 = mockRequest({ ip: ip2, userAgent: userAgent2, userId: userId1 });

    // Enqueue requests
    queue.enqueue(request1);
    queue.enqueue(request2);
    queue.enqueue(request3);
    queue.enqueue(request4); // This will now have an increased priority since it's over the threshold, along with all the other requests, to varying degrees
    queue.enqueue(request5); // This should have the lowest priority level

    // After request4, both ip1 and userAgent2 are over the threshold, increasing the priority level all the requests in the queue by different amounts.
    // request4 should have priority 1, since it's only penalized for user-agent
    expect(queue.dequeue()).toEqual(
      expect.objectContaining<RequestWithPriority<RequestData>>({ request: request5, preOpPriority: 1 })
    );

    // The next dequeue should get request4, which has priority 3 since it's not a logged-in user and ip1 is over the threshold.
    // All the other requests have priority 4, since userAgent2 is over the threshold.
    expect(queue.dequeue()).toEqual(
      expect.objectContaining<RequestWithPriority<RequestData>>({ request: request4, preOpPriority: 3 })
    );

    // The last dequeues continue based on FIFO, since the queue is no longer over the threshold size for IP or user-agent to matter
    expect(queue.dequeue().request).toEqual(request1);
    expect(queue.dequeue().request).toEqual(request2);
    expect(queue.dequeue().request).toEqual(request3);
    expect(queue.size()).toBe(0);
  });
});
