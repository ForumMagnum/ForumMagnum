#!/usr/bin/env node
const ChildProcess = require('child_process');
const { promisify } = require('util');

const exec = promisify(ChildProcess.exec);

const lintProcess = exec('yarn run --silent eslint 2>&1').catch(e => e);
const tscProcess = exec('yarn run --silent tsc').catch(e => e);
const testProcess = exec('yarn jest --forceExit --ci 2>&1').catch(e => e);

Promise.all([lintProcess, tscProcess, testProcess]).then(results => {
  results
    .filter(result => result.stdout)
    .forEach(result => console.log(result.stdout));

  // Exit with failure status if any of eslint, tsc, or jest returned failure
  const exitCode = results.find(r => r.code)?.code ?? 0;

  process.exit(exitCode);
});
