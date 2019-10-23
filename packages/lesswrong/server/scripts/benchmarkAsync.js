/* global Vulcan */
import { addGraphQLResolvers, addGraphQLQuery } from 'meteor/vulcan:core';

export const runAsyncBenchmark = async () => {
  console.log("Testing with sync calls only"); //eslint-disable-line no-console
  for (let i=0; i<25; i++) {
    await benchmarkSync({ loopCount: 100000, callDepth: i });
  }
  for (let i=25; i<100; i+=5) {
    await benchmarkSync({ loopCount: 100000, callDepth: i });
  }
  
  console.log("Testing with async calls"); //eslint-disable-line no-console
  for (let i=0; i<25; i++) {
    await benchmarkAsync({ loopCount: 1000, callDepth: i });
  }
  for (let i=25; i<100; i+=5) {
    await benchmarkAsync({ loopCount: 100, callDepth: i });
  }
  
  /*console.log("Testing with async calls plus concurrency");
  for (let i=0; i<25; i++) {
    await benchmarkAsync({ loopCount: 1000, callDepth: i, concurrency: 10 });
  }
  for (let i=25; i<100; i+=5) {
    await benchmarkAsync({ loopCount: 100, callDepth: i, concurrency: 10 });
  }*/
}

const asyncBenchmarkResolvers = {
  Query: {
    async AsyncBenchmark(root, args, context) {
      console.log("Running benchmark in a resolver context"); //eslint-disable-line no-console
      await runAsyncBenchmark();
      console.log("Finished"); //eslint-disable-line no-console
      return 0;
    }
  },
}
addGraphQLResolvers(asyncBenchmarkResolvers);
addGraphQLQuery("AsyncBenchmark: Int");

const benchmarkSync = ({
  loopCount = 10000, callDepth = 1,
}) => {
  const startTime = new Date();
  
  for (let i=0; i<loopCount; i++)
  {
    callWithSyncDepth(callDepth);
  }
  
  const endTime = new Date();
  const elapsed = endTime-startTime;
  console.log(`type: sync, loopCount: ${loopCount}, callDepth: ${callDepth}, elapsed: ${elapsed}ms, cost per iteration: ${elapsed/loopCount}ms`); //eslint-disable-line no-console
  return { loopCount, callDepth, elapsed };
}

const benchmarkAsync = async ({
  loopCount = 10000, callDepth = 1, concurrency = 1,
}) => {
  const startTime = new Date();
  
  const doAsyncCalls = async () => {
    for (let i=0; i<loopCount; i++)
    {
      await callWithAsyncDepth(callDepth);
    }
  };
  
  const concurrentFibers = [];
  for (let i=0; i<concurrency; i++)
    concurrentFibers.push(doAsyncCalls());
  await Promise.all(concurrentFibers);
  
  const endTime = new Date();
  const elapsed = endTime-startTime;
  console.log(`type: async, loopCount: ${loopCount}, callDepth: ${callDepth}, elapsed: ${elapsed}ms, cost per iteration: ${elapsed/loopCount}ms`); //eslint-disable-line no-console
  return { loopCount, callDepth, elapsed };
}

/*const callWithSyncDepthAndThen = (callDepth, innerFn) => {
  if (callDepth > 1) {
    callWithSyncDepthAndThen(callDepth-1, innerFn);
  } else {
    innerFn();
  }
}*/

const callWithSyncDepth = (callDepth) => {
  if (callDepth > 1) {
    callWithSyncDepth(callDepth-1);
  }
}

const callWithAsyncDepth = async (callDepth) => {
  if (callDepth > 1) {
    await callWithAsyncDepth(callDepth-1);
  }
}

Vulcan.benchmarkAsync = benchmarkAsync;
Vulcan.runAsyncBenchmark = runAsyncBenchmark;
