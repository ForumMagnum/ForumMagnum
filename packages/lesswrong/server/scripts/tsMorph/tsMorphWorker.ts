/* eslint-disable */

type ProcessBatchFunction = (
  filePaths: string[],
  parentPort: typeof import('worker_threads').parentPort,
  workerData: typeof import('worker_threads').workerData
) => Promise<Array<{ filePath: string, status: 'modified' | 'no_changes_needed' | 'not_applicable' | 'error', error?: string }>>;

export async function startWorkerForBatch(processBatchFunction: ProcessBatchFunction) {
  const { parentPort, workerData } = require('worker_threads');

  if (!parentPort) {
    throw new Error('This script should be run via worker_threads');
  }

  if (workerData && workerData.filePaths && Array.isArray(workerData.filePaths)) {
    parentPort.postMessage({ message: 'Worker: Received initial task via workerData', status: 'info' });
    console.log('foobar console.log!');
    console.log('foobar console.log 2!');
    parentPort.postMessage({ message: `foobar!`, status: 'info' });

    console.log('foobar console.log 3!');

    try {
      const results = await processBatchFunction(workerData.filePaths, parentPort, workerData);
      parentPort.postMessage({ message: 'Worker: Sending batch results back to main', status: 'info' });
      parentPort.postMessage(results); // Send the batch results
    } catch (error) {
      // This catch is for unexpected errors from processBatchOfFiles itself if it somehow rejects
      // (though processBatchOfFiles is designed to always resolve with an array of results)
        parentPort.postMessage({ message: `Worker: Error caught in processBatchFunction promise chain: ${error.message || String(error)}`, status: 'error' }); // DIAGNOSTIC
        const errorResults = workerData.filePaths.map((fp: string) => ({
          filePath: fp,
          status: 'error',
          error: `Batch processing failed: ${error.message || String(error)}`
        }));
      parentPort.postMessage(errorResults);
    } finally { // DIAGNOSTIC
      parentPort.postMessage({ message: `${new Date().toISOString()} Worker: processBatchFunction promise settled (finally block executed).`, status: 'info' });
    }
  } else {
    parentPort.postMessage({ message: 'Worker: No filePaths found in workerData or parentPort missing.', status: 'error' });
    // If it's a worker but no filePaths, it should still signal completion or error to the main thread
    if (parentPort) {
      parentPort.postMessage([{
        filePath: workerData?.filePaths?.[0] || 'unknown_batch',
        status: 'error',
        error: 'Worker started without valid filePaths in workerData'
      }]);
    }
  }
}
