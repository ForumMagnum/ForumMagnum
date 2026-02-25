import { initGlobals } from "./scriptUtil";
import * as tsNode from 'ts-node';
import omit from "lodash/omit";
import { loadReplEnv, ProjectEnv } from "./runWithVercelEnv";
import { PassThrough, Writable } from "stream";

import { initConsole } from "../packages/lesswrong/server/serverStartup";

/* eslint-disable no-console */

function createDevNullWritable() {
  return new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    },
  });
}

async function replMain() {
  const projectEnvSettings = await loadReplEnv();
  const { environment, codegen } = projectEnvSettings;

  if (!projectEnvSettings.codegen) {
    console.log('Running REPL in mode', environment);
  }

  initGlobals(environment==="prod", { bundleIsCodegen: codegen });
  initConsole();
  
  const shouldRunSingleCommand = !!projectEnvSettings.command;
  const repl = tsNode.createRepl(
    shouldRunSingleCommand
      ? {
        // In one-shot command mode, avoid reading from stdin or printing a prompt.
        stdin: new PassThrough(),
        stdout: createDevNullWritable(),
        stderr: process.stderr,
      }
      : undefined
  );
  const service = tsNode.create({...repl.evalAwarePartialHost, swc: true, compilerOptions: { module: 'commonjs' }});
  repl.setService(service);
  repl.start();
  let defaultExport: (() => any)|undefined = undefined;

  if (projectEnvSettings.file) {
    // Import the specified file
    repl.evalCode(`import * as __repl_import from ${JSON.stringify(projectEnvSettings.file)};\n`);
    // Get a list of its exports
    const __repl_import = repl.evalCode("__repl_import\n");
    defaultExport = __repl_import["default"];
    // Copy them into the global namespace
    const importsExceptDefault = omit(__repl_import, "default");
    repl.evalCode(`const {${Object.keys(importsExceptDefault).join(", ")}} = __repl_import;\n`);
  }

  if (projectEnvSettings.command) {
    try {
      const result = await repl.evalCode(projectEnvSettings.command);
      if (result !== undefined) {
        console.log(result);
      }
    } catch(e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  } else if (defaultExport && typeof defaultExport==='function') {
    try {
      const result = await defaultExport();
      if (result !== undefined) {
        console.log(result);
      }
    } catch(e) {
      console.error(e);
    } finally {
      process.exit(0);
    }
  }
}

void replMain();
