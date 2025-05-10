/* eslint-disable */
import { Project } from 'ts-morph'; // Reduced imports
import path from 'path';
import { Worker } from 'worker_threads';
import os from 'os';

const BATCH_SIZE = 50; // Number of files per worker batch

// --- Main Script ---
async function main(workerScriptPath: string) {
  const tsConfigForProjectAndWorkers = path.resolve(__dirname, '../../../../../tsconfig.json');

  // Use a temporary, lightweight project just for discovering files via glob
  const discoveryProject = new Project();
  const componentsDirPath = path.resolve(__dirname, '../../../components');
  console.log(`Discovering .tsx files in: ${componentsDirPath}/**/*.tsx`);
  discoveryProject.addSourceFilesAtPaths(`${componentsDirPath}/**/*.tsx`);
  // Explicitly filter for .tsx here to be absolutely sure
  const sourceFilePaths = discoveryProject.getSourceFiles().map(sf => sf.getFilePath()).filter(fp => fp.endsWith('.tsx'));

  if (sourceFilePaths.length === 0) {
    console.warn(`Warning: No .tsx files were loaded from glob: ${componentsDirPath}/**/*.tsx`);
    return;
  }
  console.log(`Found ${sourceFilePaths.length} .tsx files to process via glob.`);

  const numCPUCores = Math.max(1, os.cpus().length - 1);
  console.log(`Limiting concurrent workers to ${numCPUCores} (based on CPU cores).`);

  let totalFilesProcessedCount = 0;
  const allResults: { filePath: string, status: string, error?: string }[] = [];

  const fileBatches: string[][] = [];
  for (let i = 0; i < sourceFilePaths.length; i += BATCH_SIZE) {
    fileBatches.push(sourceFilePaths.slice(i, i + BATCH_SIZE));
  }
  console.log(`Divided files into ${fileBatches.length} batches of up to ${BATCH_SIZE} files each.`);

  // processBatchWithWorker returns a Promise of the batch results for better tracking
  const processBatchWithWorker = (filePathsInBatch: string[], batchNumber: number): Promise<Array<{ filePath: string, status: string, error?: string }>> => {
    return new Promise<Array<{ filePath: string, status: string, error?: string }>>((resolve, reject) => {
      const worker = new Worker(workerScriptPath, {
        workerData: { 
          filePaths: filePathsInBatch, 
          tsConfigFilePath: tsConfigForProjectAndWorkers,
          allSourceFilePaths: sourceFilePaths // Pass the complete list of discovered files
        }
      });
      let settled = false;

      worker.on('message', (batchResultPayload: Array<{ filePath: string, status: string, error?: string }>) => {
        if (!settled) {
          settled = true;
          if (Array.isArray(batchResultPayload)) {
            batchResultPayload.forEach(result => {
              totalFilesProcessedCount++; // Increment only when a result for a file is processed
              console.log(`[${totalFilesProcessedCount}/${sourceFilePaths.length}] ${result.filePath}: ${result.status} ${result.error ? `- ${result.error}` : ''}`);
              allResults.push(result);
            });
            resolve(batchResultPayload); // Resolve with the array of results
          } else {
            console.error(`[Batch ${batchNumber}] Unexpected message format from worker:`, batchResultPayload);
            const errorResults = filePathsInBatch.map(fp => ({ filePath: fp, status: 'error', error: 'Malformed batch result from worker' }));
            errorResults.forEach(r => { if (!allResults.some(ar => ar.filePath === r.filePath)) totalFilesProcessedCount++; allResults.push(r); });
            resolve(errorResults); // Resolve with errors for this batch
          }
        }
      });

      worker.on('error', (err) => {
        if (!settled) {
          settled = true;
          console.error(`[Batch ${batchNumber}] Critical error from worker:`, err);
          const errorResults = filePathsInBatch.map(fp => ({ filePath: fp, status: 'error', error: `Worker errored: ${err.message || String(err)}` }));
          errorResults.forEach(r => { if (!allResults.some(ar => ar.filePath === r.filePath)) totalFilesProcessedCount++; allResults.push(r); });
          // Resolve with error results instead of rejecting Promise.allSettled, 
          // as individual file errors are what we want to track in allResults.
          resolve(errorResults);
        }
      });

      worker.on('exit', (code) => {
        if (!settled) {
          settled = true;
          if (code !== 0) {
            console.error(`[Batch ${batchNumber}] Worker stopped with exit code ${code}.`);
            const errorResults = filePathsInBatch.map(fp => ({ filePath: fp, status: 'error', error: `Worker exited with code ${code}` }));
            errorResults.forEach(r => { if (!allResults.some(ar => ar.filePath === r.filePath)) totalFilesProcessedCount++; allResults.push(r); });
            resolve(errorResults);
          } else {
            // If it exited cleanly without a message, it implies an issue or empty batch processed okay.
            // Resolve with empty array or current allResults for this batch if any were somehow processed before exit.
            const currentBatchFilePathsSet = new Set(filePathsInBatch);
            const resultsForThisBatch = allResults.filter(r => currentBatchFilePathsSet.has(r.filePath));
            if (resultsForThisBatch.length < filePathsInBatch.length) {
              filePathsInBatch.forEach(fp => {
                if (!allResults.some(ar => ar.filePath === fp)) {
                  totalFilesProcessedCount++;
                  allResults.push({ filePath: fp, status: 'error', error: 'Worker exited cleanly without sending full batch results' });
                }
              });
            }
            resolve(allResults.filter(r => currentBatchFilePathsSet.has(r.filePath)));
          }
        }
      });
    });
  };

  // Process the first batch with a worker to build the component cache, if needed
  await processBatchWithWorker(fileBatches.shift()!, -1);

  // --- Worker Pool Management ---
  const executingPromises: Promise<Array<{ filePath: string, status: string, error?: string }>>[] = [];
  const allLaunchedPromises: Promise<Array<{ filePath: string, status: string, error?: string }>>[] = [];

  for (let i = 0; i < fileBatches.length; i++) {
    if (executingPromises.length >= numCPUCores) {
      try {
        await Promise.race(executingPromises);
      } catch (e) { /* Individual promise rejections are handled by their .catch, or aren't fatal if processBatchWithWorker resolves with error array */ }
    }

    const batch = fileBatches[i];
    const workerPromise = processBatchWithWorker(batch, i + 1);

    allLaunchedPromises.push(workerPromise);
    executingPromises.push(workerPromise);

    const removeFromExecuting = () => {
      const index = executingPromises.indexOf(workerPromise);
      if (index > -1) executingPromises.splice(index, 1);
    };
    workerPromise.then(removeFromExecuting).catch(removeFromExecuting); // Ensure removal on settle
  }

  await Promise.allSettled(allLaunchedPromises);
  // --- End Worker Pool Management ---

  console.log("\n--- Processing Summary ---");
  const modifiedCount = allResults.filter(r => r.status === 'modified').length;
  const noChangesCount = allResults.filter(r => r.status === 'no_changes_needed').length;
  const notApplicableCount = allResults.filter(r => r.status === 'not_applicable').length;
  const errorCount = allResults.filter(r => r.status === 'error').length;
  console.log(`Total Files Accounted For: ${allResults.length} / Target Files: ${sourceFilePaths.length}`);
  console.log(`Total Files Processed Log Counter: ${totalFilesProcessedCount}`);
  console.log(`Modified: ${modifiedCount}`);
  console.log(`No Changes Needed: ${noChangesCount}`);
  console.log(`Not Applicable: ${notApplicableCount}`);
  console.log(`Errors: ${errorCount}`);
  if (errorCount > 0) {
    console.log("\nFiles with errors:");
    allResults.filter(r => r.status === 'error').forEach(r => console.log(`  - ${r.filePath}: ${r.error}`));
  }

  console.log("\nScript finished.");
}

main(path.resolve(__dirname, process.argv[2] || 'convertStylesWorker.js')).catch(err => {
  console.error("Critical error in main script execution:", err);
});
