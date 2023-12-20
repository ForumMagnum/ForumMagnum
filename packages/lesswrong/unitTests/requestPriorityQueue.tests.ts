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
    const requestsFromUserAgent1 = [];
    const threshold = 4; // We create enough requests to pass the queue size threshold
    const userAgent1 = generateMockUserAgent();
    const userAgent2 = generateMockUserAgent();
  
    for (let i = 0; i < threshold; i++) {
      const request = mockRequest({ userAgent: userAgent1 });
      queue.enqueue(request);
      requestsFromUserAgent1.push(request);

      // Every request before the last one should be priority 1; the last one should cause a +1 priority rebucketing
      const expectedPriority = i < 3 ? 1 : 2;
      const currentNextResult = queue.peek();
      expect(currentNextResult).toEqual(expect.objectContaining<RequestWithPriority<RequestData>>({ request: requestsFromUserAgent1[0], preOpPriority: expectedPriority }));      
    }
  
    const requestDifferentUserAgent = mockRequest({ userAgent: userAgent2 });
    queue.enqueue(requestDifferentUserAgent);
  
    // Check that the requestDifferentUserAgent gets dequeued first as its user-agent is not over the threshold
    expect(queue.dequeue().request).toEqual(requestDifferentUserAgent);
  
    // The rest of the dequeued items should come from userAgent1
    requestsFromUserAgent1.forEach((request, idx) => {
      const dequeueResult = queue.dequeue();

      // The first item dequeued should have had priority 2, but everything gets rebucketed after that since there aren't enough requests in the queue anymore
      const expectedPriority = idx > 0 ? 1 : 2;
      expect(dequeueResult).toEqual(expect.objectContaining<RequestWithPriority<RequestData>>({ request, preOpPriority: expectedPriority }));      
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

  it('should handle three different priority levels', () => {
    const userAgent1 = generateMockUserAgent();
    const userAgent2 = generateMockUserAgent();

    const ip1 = generateMockIpAddress();
    const ip2 = generateMockIpAddress();

    const request1 = mockRequest({ ip: ip1, userAgent: userAgent1 });
    const request2 = mockRequest({ ip: ip1, userAgent: userAgent2 });
    const request3 = mockRequest({ ip: ip1, userAgent: userAgent2 });
    const request4 = mockRequest({ ip: ip2, userAgent: userAgent1, userId: userId1 });

    // Enqueue requests
    queue.enqueue(request1);
    queue.enqueue(request2);
    queue.enqueue(request3); // This will now have an increased priority since it's over the threshold
    queue.enqueue(request4); // This should have the lowest priority level

    // After request3, both ip1 and userAgent2 are over the threshold, increasing the priority level of the first 3 requests.
    expect(queue.dequeue().request).toEqual(request4);

    // The next dequeue should get request1, as it has a lower priority level than request2 and request3 from the non-shared user agent
    expect(queue.dequeue().request).toEqual(request1);

    // The last dequeues continue based on FIFO
    expect(queue.dequeue().request).toEqual(request2);
    expect(queue.dequeue().request).toEqual(request3);
    expect(queue.size()).toBe(0);
  });
});
