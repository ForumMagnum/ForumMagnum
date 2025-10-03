import { initGlobals } from "./scriptUtil";
import * as tsNode from 'ts-node';
import omit from "lodash/omit";
import { loadReplEnv, ProjectEnv } from "./runWithVercelEnv";

import { initConsole } from "../packages/lesswrong/server/serverStartup";

/* eslint-disable no-console */

async function replMain() {
  const projectEnvSettings = await loadReplEnv();
  const { environment, codegen } = projectEnvSettings;

  console.log('Running REPL in mode', environment);

  initGlobals(environment==="prod", { bundleIsCodegen: codegen });
  initConsole();
  
  const repl = tsNode.createRepl();
  const service = tsNode.create({...repl.evalAwarePartialHost, swc: true, compilerOptions: { module: 'commonjs' }});
  repl.setService(service);
  repl.start();
  (async () => {
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
        console.log(result);
      } catch(e) {
        console.error(e);
      } finally {
        process.exit(0);
      }
    } else if (defaultExport && typeof defaultExport==='function') {
      try {
        const result = await defaultExport();
        console.log(result);
      } catch(e) {
        console.error(e);
      } finally {
        process.exit(0);
      }
    }
  })();
}

void replMain();
