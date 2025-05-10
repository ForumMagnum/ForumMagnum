/* eslint-disable */

type ProcessBatchFunction = (filePaths: string[]) => Promise<Array<{ filePath: string, status: 'modified' | 'no_changes_needed' | 'not_applicable' | 'error', error?: string }>>;

export async function startWorkerForBatch(processBatchFunction: ProcessBatchFunction) {
  // This part allows the worker to receive messages and call processFile
  const { parentPort, workerData } = require('worker_threads'); // Ensure workerData is extracted

  if (!parentPort) {
    throw new Error('This script should be run via worker_threads');
  }

  if (workerData && workerData.filePaths && Array.isArray(workerData.filePaths)) {
    console.log('Worker: Received initial task via workerData'); // DEBUG LOG
    processBatchFunction(workerData.filePaths)
      .then(results => {
        console.log('Worker: Sending batch results back to main'); // DEBUG LOG
        parentPort.postMessage(results); // Send the batch results
      })
      .catch(error => {
        // This catch is for unexpected errors from processBatchOfFiles itself if it somehow rejects
        // (though processBatchOfFiles is designed to always resolve with an array of results)
        console.error(`Worker: Error during processBatchOfFiles for batch (first file: ${workerData.filePaths.length > 0 ? workerData.filePaths[0] : 'N/A'}):`, error);
        const errorResults = workerData.filePaths.map((fp: string) => ({
          filePath: fp,
          status: 'error',
          error: `Batch processing failed: ${error.message || String(error)}`
        }));
        parentPort.postMessage(errorResults);
      });
  } else {
    console.error('Worker: No filePaths found in workerData or parentPort missing.', { hasParentPort: !!parentPort, hasWorkerData: !!workerData });
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
