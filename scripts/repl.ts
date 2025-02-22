import { EnvironmentType, ForumType, detectForumType, getDatabaseConfigFromModeAndForumType, getSettingsFileName, getSettingsFilePath, initGlobals, isEnvironmentType, isForumType } from "./scriptUtil";
import * as tsNode from 'ts-node';
import omit from "lodash/omit";

interface CommandLineOptions {
  environment: EnvironmentType|null
  forumType: ForumType|null

  file: string|null
  command: string|null
}

function parseCommandLine(): CommandLineOptions {
  const argv = process.argv;
  let result: CommandLineOptions = {
    environment: null,
    forumType: null,
    file: null,
    command: null,
  }

  for (let i=2; i<argv.length; i++) {
    const arg = argv[i];
    switch(arg) {
      case "-h": case "-help": case "--help": case "/?":
        printHelpText();
        process.exit(0);
      default:
        if (isForumType(arg)) {
          result.forumType = arg;
        } else if (isEnvironmentType(arg)) {
          result.environment = arg;
        } else {
          if (!result.file) {
            result.file = arg;
          } else if (!result.command) {
            result.command = arg;
          } else {
            console.error("Too many positional arguments");
            process.exit(1);
          }
        }
        break;
    }
  }
  
  /*if (result.file && !result.command) {
    console.error("Wrong number of arguments. If you specify a filename, you must also specify a command.");
    process.exit(1);
  }*/
  if (!result.environment) {
    console.error("Please specify an environment (dev, prod, local, etc)");
    process.exit(1);
  }
  if (!result.forumType) {
    result.forumType = detectForumType();
  }
  return result;
}

function printHelpText() {
  console.log(
`Usage: yarn repl [mode] [forum-type]
Or: yarn repl [mode] [forum-type] [filename] [js]

[mode] is "dev", "prod", "local", etc.
[forum-type] is "lw", "ea", or "af" (optional).

Examples:
  To make a REPL connecting to the LW dev DB:
    yarn repl dev lw
  To run exampleFunction from packages/lesswrong/server/scripts/example.ts:
    yarn repl dev lw packages/lesswrong/server/scripts/example.ts 'exampleFunction()'
  To run a function which is the default export from packages/lesswrong/server/scripts/example.ts:
    yarn repl dev lw packages/lesswrong/server/scripts/example.ts 'exampleFunction()'
`);
}

export async function initRepl(commandLineOptions: CommandLineOptions) {
  const mode = commandLineOptions.environment!;
  const forumType = commandLineOptions.forumType!;
  const dbConf = getDatabaseConfigFromModeAndForumType(mode, forumType);
  if (dbConf.postgresUrl) {
    process.env.PG_URL = dbConf.postgresUrl;
  }
  const args = {
    postgresUrl: process.env.PG_URL,
    settingsFileName: process.env.SETTINGS_FILE || getSettingsFileName(mode, forumType),
    shellMode: false,
  };

  //await startSshTunnel(getDatabaseConfigFromModeAndForumType(mode, forumType).sshTunnelCommand);

  if (["dev", "local", "staging", "prod", "xpost"].includes(mode)) {
    console.log('Running REPL in mode', mode);
    args.settingsFileName = getSettingsFilePath(getSettingsFileName(mode, forumType), forumType);
  } else if (args.postgresUrl && args.settingsFileName) {
    console.log('Using PG_URL and SETTINGS_FILE from environment');
  } else {
    throw new Error('Unable to run migration without a mode or environment (PG_URL and SETTINGS_FILE)');
  }

  initGlobals(args, mode==="prod");

  const {initServer} = require("../packages/lesswrong/server/serverStartup");
  await initServer(args);
}

async function replMain() {
  const commandLineOptions = parseCommandLine();

  await initRepl(commandLineOptions);
  
  const repl = tsNode.createRepl();
  const service = tsNode.create({...repl.evalAwarePartialHost});
  repl.setService(service);
  repl.start();
  (async () => {
    let defaultExport: (()=>any)|undefined = undefined;

    if (commandLineOptions.file) {
      // Import the specified file
      repl.evalCode(`import * as __repl_import from ${JSON.stringify(commandLineOptions.file)};\n`);
      // Get a list of its exports
      const __repl_import = repl.evalCode("__repl_import\n");
      defaultExport = __repl_import["default"];
      // Copy them into the global namespace
      const importsExceptDefault = omit(__repl_import, "default");
      repl.evalCode(`const {${Object.keys(importsExceptDefault).join(", ")}} = __repl_import;\n`);
    }
    if (commandLineOptions.command) {
      const result = await repl.evalCode(commandLineOptions.command);
      console.log(result);
      process.exit(0);
    } else if (defaultExport && typeof defaultExport==='function') {
      const result = await defaultExport();
      console.log(result);
      process.exit(0);
    }
  })();
}

replMain();
